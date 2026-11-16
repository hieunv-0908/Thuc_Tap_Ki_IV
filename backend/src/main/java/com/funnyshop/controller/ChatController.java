package com.funnyshop.controller;

import com.funnyshop.dto.request.ChatRequest;
import com.funnyshop.dto.response.ApiResponse;
import com.funnyshop.dto.response.ChatResponse;
import com.funnyshop.service.AiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ChatController {

    private final AiChatService aiChatService;

    @PostMapping({"/api/chat", "/api/v1/chat"})
    public ResponseEntity<ApiResponse<ChatResponse>> chat(@Valid @RequestBody ChatRequest request) {
        log.info("[AI Chat] Nhận tin nhắn từ khách: {}", request.getMessage());
        ChatResponse response = aiChatService.chat(request.getMessage());
        return ResponseEntity.ok(ApiResponse.success(response, "Thành công"));
    }

    @PostMapping({"/api/admin/ai/description", "/api/v1/admin/ai/description"})
    public ResponseEntity<ApiResponse<Map<String, String>>> generateDescription(@RequestBody Map<String, String> payload) {
        String productName = payload != null ? payload.getOrDefault("productName", "") : "";
        log.info("[AI Admin] Yêu cầu tạo mô tả cho sản phẩm: {}", productName);
        String description = aiChatService.generateProductDescription(productName);
        return ResponseEntity.ok(ApiResponse.success(Map.of("description", description), "Tạo mô tả thành công"));
    }
}

