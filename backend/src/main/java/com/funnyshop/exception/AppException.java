package com.funnyshop.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {
    private final HttpStatus status;
    private final int code;

    public AppException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.code = HttpStatus.BAD_REQUEST.value();
    }

    public AppException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.code = status.value();
    }

    public AppException(String message, HttpStatus status, int code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

