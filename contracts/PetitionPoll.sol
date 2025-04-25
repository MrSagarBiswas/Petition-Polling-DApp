// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @title PetitionPoll
/// @notice Create and manage public or private petitions and polls with one-time participation.
contract PetitionPoll {
    //–– State arrays & counters ––//
    uint256[] public petitionIds;
    uint256 public  petitionCount;

    uint256[] public pollIds;
    uint256 public  pollCount;

    //–– Internal storage ––//
    struct Petition {
        uint256 id;
        address creator;
        string  title;
        string  description;
        uint256 createdAt;
        uint256 deadline;
        bool    isPublic;
        address[] allowedAddresses;
        uint256 signatureCount;
        bool    closed;
        mapping(address => bool) allowed;
        mapping(address => bool) hasSigned;
    }

    struct Poll {
        uint256 id;
        address creator;
        string  question;
        string[] options;
        uint256 createdAt;
        uint256 deadline;
        bool    isPublic;
        address[] allowedAddresses;
        mapping(address => bool) allowed;
        mapping(address => bool) hasVoted;
        mapping(uint256 => uint256) votes;
        bool    finalized;
        uint256 winnerIndex;
    }

    mapping(uint256 => Petition) private petitions;
    mapping(uint256 => Poll)    private polls;

    //–– Events ––//
    event PetitionCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        string description,
        uint256 deadline,
        bool isPublic
    );
    event PetitionSigned(uint256 indexed id, address indexed voter);
    event PetitionFinalized(uint256 indexed id);

    event PollCreated(
        uint256 indexed id,
        address indexed creator,
        string question,
        string[] options,
        uint256 deadline,
        bool isPublic
    );
    event VoteCast(uint256 indexed pollId, address indexed voter, uint256 optionIndex);
    event PollFinalized(uint256 indexed pollId, uint256 winnerIndex);

    /// @notice Create a new petition
    function createPetition(
        string calldata title,
        string calldata description,
        uint256 durationSeconds,
        bool    isPublic,
        address[] calldata allowedAddresses
    ) external {
        require(bytes(title).length > 0, "Title required");
        require(durationSeconds > 0, "Duration must be > 0");

        petitionCount++;
        uint256 id = petitionCount;

        Petition storage p = petitions[id];
        p.id          = id;
        p.creator     = msg.sender;
        p.title       = title;
        p.description = description;
        p.createdAt   = block.timestamp;
        p.deadline    = block.timestamp + durationSeconds;
        p.isPublic    = isPublic;

        for (uint256 i = 0; i < allowedAddresses.length; i++) {
            address addr = allowedAddresses[i];
            p.allowedAddresses.push(addr);
            p.allowed[addr] = true;
        }

        petitionIds.push(id);
        emit PetitionCreated(id, msg.sender, title, description, p.deadline, isPublic);
    }

    function signPetition(uint256 petitionId) external {
        require(petitionId > 0 && petitionId <= petitionCount, "Petition does not exist");
        Petition storage p = petitions[petitionId];
        require(!p.closed, "Petition closed");
        require(block.timestamp <= p.deadline, "Deadline passed");
        require(!p.hasSigned[msg.sender], "Already signed");
        if (!p.isPublic) {
            require(p.allowed[msg.sender], "Not allowed to sign");
        }

        p.hasSigned[msg.sender] = true;
        p.signatureCount++;
        emit PetitionSigned(petitionId, msg.sender);
    }

    function finalizePetition(uint256 petitionId) external {
        require(petitionId > 0 && petitionId <= petitionCount, "Petition does not exist");
        Petition storage p = petitions[petitionId];
        require(!p.closed, "Already closed");
        require(block.timestamp > p.deadline, "Deadline not yet passed");

        p.closed = true;
        emit PetitionFinalized(petitionId);
    }

    function getPetition(uint256 petitionId)
        external
        view
        returns (
            string memory title,
            string memory description,
            uint256 createdAt,
            uint256 deadline,
            bool    isPublic,
            uint256 signatureCount,
            address[] memory allowedAddresses
        )
    {
        require(petitionId > 0 && petitionId <= petitionCount, "Petition does not exist");
        Petition storage p = petitions[petitionId];
        return (
            p.title,
            p.description,
            p.createdAt,
            p.deadline,
            p.isPublic,
            p.signatureCount,
            p.allowedAddresses
        );
    }

    function getAllPetitionIds() external view returns (uint256[] memory) {
        return petitionIds;
    }

    /// @notice Create a new poll
    function createPoll(
        string calldata question,
        string[] calldata options,
        uint256 durationSeconds,
        bool    isPublic,
        address[] calldata allowedAddresses
    ) external {
        require(options.length >= 2, "At least 2 options");
        require(durationSeconds > 0, "Duration must be > 0");

        pollCount++;
        uint256 id = pollCount;

        Poll storage pl = polls[id];
        pl.id          = id;
        pl.creator     = msg.sender;
        pl.question    = question;
        pl.createdAt   = block.timestamp;
        pl.deadline    = block.timestamp + durationSeconds;
        pl.isPublic    = isPublic;

        // store options
        for (uint256 i = 0; i < options.length; i++) {
            pl.options.push(options[i]);
        }

        // store allowed addresses
        for (uint256 i = 0; i < allowedAddresses.length; i++) {
            address addr = allowedAddresses[i];
            pl.allowedAddresses.push(addr);
            pl.allowed[addr] = true;
        }

        pollIds.push(id);
        emit PollCreated(id, msg.sender, question, pl.options, pl.deadline, isPublic);
    }

    function vote(uint256 pollId, uint256 optionIndex) external {
        require(pollId > 0 && pollId <= pollCount, "Poll does not exist");
        Poll storage pl = polls[pollId];
        require(!pl.finalized, "Poll finalized");
        require(block.timestamp <= pl.deadline, "Voting closed");
        require(optionIndex < pl.options.length, "Invalid option");
        require(!pl.hasVoted[msg.sender], "Already voted");
        if (!pl.isPublic) {
            require(pl.allowed[msg.sender], "Not allowed to vote");
        }

        pl.hasVoted[msg.sender] = true;
        pl.votes[optionIndex]++;
        emit VoteCast(pollId, msg.sender, optionIndex);
    }

    function finalizePoll(uint256 pollId) external {
        require(pollId > 0 && pollId <= pollCount, "Poll does not exist");
        Poll storage pl = polls[pollId];
        require(!pl.finalized, "Already finalized");
        require(block.timestamp > pl.deadline, "Voting not yet closed");

        uint256 winningIndex;
        uint256 highest;
        for (uint256 i = 0; i < pl.options.length; i++) {
            if (pl.votes[i] > highest) {
                highest = pl.votes[i];
                winningIndex = i;
            }
        }
        pl.finalized   = true;
        pl.winnerIndex = winningIndex;
        emit PollFinalized(pollId, winningIndex);
    }

    function getPoll(uint256 pollId)
        external
        view
        returns (
            string memory question,
            string[] memory options,
            uint256 createdAt,
            uint256 deadline,
            bool    isPublic,
            uint256[] memory voteCounts,
            address[] memory allowedAddresses
        )
    {
        require(pollId > 0 && pollId <= pollCount, "Poll does not exist");
        Poll storage pl = polls[pollId];

        uint256 len = pl.options.length;
        uint256[] memory counts = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            counts[i] = pl.votes[i];
        }

        return (
            pl.question,
            pl.options,
            pl.createdAt,
            pl.deadline,
            pl.isPublic,
            counts,
            pl.allowedAddresses
        );
    }

    function getAllPollIds() external view returns (uint256[] memory) {
        return pollIds;
    }

    /// @notice Check whether `user` has already voted in poll `pollId`.
    function hasVotedInPoll(uint256 pollId, address user)
        external
        view
        returns (bool)
    {
        require(pollId > 0 && pollId <= pollCount, "Poll does not exist");
        return polls[pollId].hasVoted[user];
    }

    /// @notice Check whether `user` is eligible to vote in poll `pollId`.
    function isEligibleToVote(uint256 pollId, address user)
        external
        view
        returns (bool)
    {
        require(pollId > 0 && pollId <= pollCount, "Poll does not exist");
        Poll storage pl = polls[pollId];
        if (pl.isPublic) {
            return true;
        } else {
            return pl.allowed[user];
        }
    }
}
