package com.aoop.aooplost.repository;

import com.aoop.aooplost.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByReviewee_Id(UUID revieweeId);
    List<Review> findByReviewer_Id(UUID reviewerId);
    List<Review> findByMatch_Id(UUID matchId);
    boolean existsByMatch_IdAndReviewer_Id(UUID matchId, UUID reviewerId);
}
