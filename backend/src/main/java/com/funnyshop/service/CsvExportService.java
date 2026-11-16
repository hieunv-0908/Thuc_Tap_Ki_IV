package com.funnyshop.service;

import com.funnyshop.enums.OrderStatus;

import java.io.IOException;
import java.io.Writer;
import java.time.LocalDateTime;

public interface CsvExportService {

    void exportOrdersToCsv(
            Writer writer,
            String search,
            OrderStatus status,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) throws IOException;

    void exportProductsToCsv(
            Writer writer,
            String keyword,
            Long categoryId,
            Boolean isDeleted
    ) throws IOException;
}
