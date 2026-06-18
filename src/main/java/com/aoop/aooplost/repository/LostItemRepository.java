package com.aoop.aooplost.repository;

import com.aoop.aooplost.entity.LostItem;
import com.aoop.aooplost.entity.enums.ItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface LostItemRepository extends JpaRepository<LostItem, UUID> {
    List<LostItem> findAllByOrderByCreatedAtDesc();
    List<LostItem> findByStatusOrderByCreatedAtDesc(ItemStatus status);
}
