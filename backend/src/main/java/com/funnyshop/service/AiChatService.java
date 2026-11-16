package com.funnyshop.service;

import com.funnyshop.dto.response.ChatResponse;

public interface AiChatService {

    ChatResponse chat(String message);

    String generateProductDescription(String productName);
}

