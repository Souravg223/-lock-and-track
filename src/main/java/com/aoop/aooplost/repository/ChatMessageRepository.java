package com.aoop.aooplost.repository;

import com.aoop.aooplost.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByMatchIdOrderByCreatedAtAsc(UUID matchId);
}
