package com.funnyshop.exception;

import org.springframework.http.HttpStatus;

public class GlobalHandleException extends RuntimeException{
    private final HttpStatus httpStatus;

    public GlobalHandleException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }
}
