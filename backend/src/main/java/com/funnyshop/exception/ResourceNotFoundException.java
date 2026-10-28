package com.funnyshop.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends GlobalHandleException {
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
