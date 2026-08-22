import 'package:flutter/material.dart';

enum ScanResultStatus { valid, duplicate, invalid }

class ScanResult {
  final ScanResultStatus status;
  final String title;
  final String message;
  final String? category;
  final String? attendee;
  final String? time;
  final String? timeLabel;
  final String? checkedInTime;
  final String? checkedOutTime;

  ScanResult({
    required this.status,
    required this.title,
    required this.message,
    this.category,
    this.attendee,
    this.time,
    this.timeLabel,
    this.checkedInTime,
    this.checkedOutTime,
  });
}

class ScanResultWidget extends StatelessWidget {
  final ScanResult result;
  final VoidCallback onClose;

  const ScanResultWidget({
    super.key,
    required this.result,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    Color statusColor;
    IconData statusIcon;

    switch (result.status) {
      case ScanResultStatus.valid:
        statusColor = const Color(0xFF10B981); // Emerald Green
        statusIcon = Icons.check_circle_outline_rounded;
        break;
      case ScanResultStatus.duplicate:
        statusColor = Colors.orangeAccent; // Duplicate warning
        statusIcon = Icons.warning_amber_rounded;
        break;
      case ScanResultStatus.invalid:
        statusColor = const Color(0xFFEF4444); // Crimson Red
        statusIcon = Icons.error_outline_rounded;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24.0)),
        border: Border(top: BorderSide(color: statusColor.withOpacity(0.5), width: 3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Icon and Title
          Row(
            children: [
              Icon(statusIcon, color: statusColor, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  result.title,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Message details
          Text(
            result.message,
            style: TextStyle(fontSize: 14, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7)),
          ),
          const SizedBox(height: 20),

          // Attendee detail cards if valid or duplicate
          if (result.attendee != null || result.category != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.04),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  if (result.attendee != null)
                    _buildDetailRow(context, 'Nama Pembeli', result.attendee!),
                  if (result.attendee != null && result.category != null)
                    const Divider(height: 16),
                  if (result.category != null)
                    _buildDetailRow(context, 'Kategori Tiket', result.category!),
                  if (result.time != null) ...[
                    const Divider(height: 16),
                    _buildDetailRow(context, result.timeLabel ?? 'Waktu', result.time!),
                  ],
                  if (result.checkedInTime != null) ...[
                    const Divider(height: 16),
                    _buildDetailRow(context, 'Terakhir Masuk', result.checkedInTime!),
                  ],
                  if (result.checkedOutTime != null) ...[
                    const Divider(height: 16),
                    _buildDetailRow(context, 'Terakhir Keluar', result.checkedOutTime!),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Action Button
          ElevatedButton(
            onPressed: onClose,
            style: ElevatedButton.styleFrom(
              backgroundColor: statusColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14.0),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.0)),
            ),
            child: const Text(
              'Lanjutkan Scan',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
      ],
    );
  }
}
