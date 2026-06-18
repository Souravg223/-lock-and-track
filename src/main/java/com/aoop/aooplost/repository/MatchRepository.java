package com.aoop.aooplost.repository;

import com.aoop.aooplost.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID> {
    List<Match> findByLostItem_UserIdOrFoundItem_UserId(UUID lostItemUserId, UUID foundItemUserId);
    boolean existsByLostItem_IdAndFoundItem_Id(UUID lostItemId, UUID foundItemId);
}
