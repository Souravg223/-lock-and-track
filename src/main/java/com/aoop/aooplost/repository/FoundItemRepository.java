package com.aoop.aooplost.repository;

import com.aoop.aooplost.entity.FoundItem;
import com.aoop.aooplost.entity.enums.ItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface FoundItemRepository extends JpaRepository<FoundItem, UUID> {
    List<FoundItem> findAllByOrderByCreatedAtDesc();
    List<FoundItem> findByStatusOrderByCreatedAtDesc(ItemStatus status);
}
