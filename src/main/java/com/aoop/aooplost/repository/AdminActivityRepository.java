package com.aoop.aooplost.repository;

import com.aoop.aooplost.entity.AdminActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminActivityRepository extends JpaRepository<AdminActivity, Long> {
    // Fetch auto-block system entries (action must contain "AUTO-BLOCK")
    List<AdminActivity> findByActionContainingOrderByTimestampDesc(String keyword);
    // Fetch all activities ordered newest first
    List<AdminActivity> findAllByOrderByTimestampDesc();
}
