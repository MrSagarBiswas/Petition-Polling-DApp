// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Verifier.sol";
import "./VRFConsumerBase.sol";

/// @title PetitionPoll
/// @notice Allows creation of zero-knowledge Merkle-based petitions and polls,
/// enforces deadlines, and supports Hedera-Scheduled transactions for automatic finalization.
contract PetitionPoll is VRFConsumerBase {
    Verifier public verifier;

    bytes32 internal keyHash;
    uint256 internal fee;

    // Enumeration arrays
    uint256[] public petitionIds;
    uint256[] public pollIds;

    constructor(address _verifier) VRFConsumerBase(address(0), address(0)) {
        verifier = Verifier(_verifier);
        keyHash = 0;
        fee = 0;
    }

    struct Petition {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 createdAt;
        uint256 deadline;
        bytes32 merkleRoot;
        bool validated;
        bool closed;
        uint256 signatureCount;
        mapping(bytes32 => bool) nullified;
    }

    struct Poll {
        uint256 id;
        address creator;
        string question;
        string[] options;
        uint256 createdAt;
        bytes32 merkleRoot;
        uint256 deadline;
        bool finalized;
        mapping(uint256 => uint256) votes;
        mapping(bytes32 => bool) nullified;
        uint256 randomResult;
    }

    uint256 public petitionCount;
    uint256 public pollCount;

    mapping(uint256 => Petition) public petitions;
    mapping(uint256 => Poll) public polls;

    event PetitionCreated(uint256 indexed id, uint256 deadline);
    event PetitionValidated(uint256 indexed id);
    event PetitionSigned(uint256 indexed id);
    event PetitionClosed(uint256 indexed id, uint256 totalSignatures);

    event PollCreated(uint256 indexed id, uint256 deadline);
    event VoteCast(uint256 indexed pollId);
    event PollFinalized(uint256 indexed pollId, uint256 winnerIndex);

    /// @notice Create a petition with a given duration (seconds)
    function createPetition(
        string calldata title,
        string calldata description,
        bytes32 merkleRoot,
        uint256 durationSeconds
    ) external {
        petitionCount++;
        Petition storage p = petitions[petitionCount];
        p.id = petitionCount;
        p.creator = msg.sender;
        p.title = title;
        p.description = description;
        p.createdAt = block.timestamp;
        p.deadline = block.timestamp + durationSeconds;
        p.merkleRoot = merkleRoot;
        p.closed = false;

        petitionIds.push(petitionCount);
        emit PetitionCreated(p.id, p.deadline);
    }

    /// @notice Validate a petition's initial proof before signing
    function validatePetition(
        uint256 petitionId,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata input
    ) external {
        Petition storage p = petitions[petitionId];
        require(msg.sender == p.creator, "Only creator");
        require(!p.validated, "Already validated");
        bool ok = verifier.verifyProof(a, b, c, input);
        require(ok, "Invalid proof");
        p.validated = true;
        emit PetitionValidated(petitionId);
    }

    /// @notice Sign a petition if still within deadline
    function signPetition(
        uint256 petitionId,
        bytes32 nullifierHash,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata input
    ) external {
        Petition storage p = petitions[petitionId];
        require(!p.closed, "Petition closed");
        require(block.timestamp <= p.deadline, "Deadline passed");
        require(p.validated, "Not validated");
        require(!p.nullified[nullifierHash], "Already signed");
        bool ok = verifier.verifyProof(a, b, c, input);
        require(ok && input[0] == uint256(p.merkleRoot), "Invalid proof/root");

        p.nullified[nullifierHash] = true;
        p.signatureCount++;
        emit PetitionSigned(petitionId);
    }

    /// @notice Close petition when deadline passes; to be called by Hedera Scheduled txn
    function finalizePetition(uint256 petitionId) external {
        Petition storage p = petitions[petitionId];
        require(!p.closed, "Already closed");
        require(block.timestamp > p.deadline, "Still active");
        p.closed = true;
        emit PetitionClosed(petitionId, p.signatureCount);
    }

    /// @notice Create a poll with given duration
    function createPoll(
        string calldata question,
        string[] calldata options,
        bytes32 merkleRoot,
        uint256 durationSeconds
    ) external {
        require(options.length >= 2, "At least 2 options");
        pollCount++;
        Poll storage pl = polls[pollCount];
        pl.id = pollCount;
        pl.creator = msg.sender;
        pl.question = question;
        pl.createdAt = block.timestamp;
        pl.merkleRoot = merkleRoot;
        pl.deadline = block.timestamp + durationSeconds;
        pl.finalized = false;
        for (uint i = 0; i < options.length; i++) {
            pl.options.push(options[i]);
        }

        pollIds.push(pollCount);
        emit PollCreated(pl.id, pl.deadline);
    }

    /// @notice Cast vote if poll still active
    function vote(
        uint256 pollId,
        uint256 optionIndex,
        bytes32 nullifierHash,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata input
    ) external {
        Poll storage pl = polls[pollId];
        require(!pl.finalized, "Poll finalized");
        require(block.timestamp <= pl.deadline, "Voting closed");
        require(!pl.nullified[nullifierHash], "Already voted");
        require(optionIndex < pl.options.length, "Invalid option");
        bool ok = verifier.verifyProof(a, b, c, input);
        require(ok && input[0] == uint256(pl.merkleRoot), "Invalid proof/root");

        pl.nullified[nullifierHash] = true;
        pl.votes[optionIndex]++;
        emit VoteCast(pollId);
    }

    /// @notice Finalize poll; to be called by Hedera Scheduled txn or manually after deadline
    function finalizePoll(uint256 pollId) external {
        Poll storage pl = polls[pollId];
        require(!pl.finalized, "Already finalized");
        require(block.timestamp > pl.deadline, "Still active");

        uint256 maxVotes;
        uint256 winnerIndex;
        for (uint i = 0; i < pl.options.length; i++) {
            if (pl.votes[i] > maxVotes) {
                maxVotes = pl.votes[i];
                winnerIndex = i;
            }
        }

        pl.finalized = true;
        pl.randomResult = winnerIndex;
        emit PollFinalized(pollId, winnerIndex);
    }

    function fulfillRandomness(bytes32, uint256) internal override {
        // not used when finalized on-schedule
    }

    /// @notice Return all created petition IDs
    function getPetitions() external view returns (uint256[] memory) {
        return petitionIds;
    }

    /// @notice Return all created poll IDs
    function getPolls() external view returns (uint256[] memory) {
        return pollIds;
    }

    /// @notice Return basic info for a given petition
    function getPetitionInfo(uint256 petitionId) external view returns (
        string memory title,
        string memory description,
        uint256 createdAt,
        uint256 deadline,
        uint256 signatureCount,
        bool closed
    ) {
        Petition storage p = petitions[petitionId];
        return (p.title, p.description, p.createdAt, p.deadline, p.signatureCount, p.closed);
    }

    /// @notice Return basic info for a given poll
    function getPollInfo(uint256 pollId) external view returns (
        string memory question,
        string[] memory options,
        uint256 createdAt,
        bool active
    ) {
        Poll storage p = polls[pollId];
        bool activeFlag = block.timestamp <= p.deadline;
        return (p.question, p.options, p.createdAt, activeFlag);
    }

    /// @notice Return poll results & status
    function getPollResults(uint256 pollId) external view returns (
        string[] memory options,
        uint256[] memory counts,
        bool finalized,
        uint256 winnerIndex
    ) {
        Poll storage pl = polls[pollId];
        uint256 len = pl.options.length;
        uint256[] memory countsArr = new uint256[](len);
        for (uint i = 0; i < len; i++) {
            countsArr[i] = pl.votes[i];
        }
        return (pl.options, countsArr, pl.finalized, pl.randomResult);
    }
}

/*
Client-side, use Hedera ScheduleCreateTransaction to schedule calls to finalizePetition
and finalizePoll at their deadlines. See Hedera SDK docs for example.
*/
