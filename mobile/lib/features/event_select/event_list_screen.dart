import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:intl/intl.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/dio_client.dart';
import '../../core/local_db/isar_service.dart';
import '../../core/local_db/models/ticket_cache.dart';
import '../auth/auth_provider.dart';
import '../scanner/scanner_screen.dart';

class EventModel {
  final String id;
  final String title;
  final String location;
  final String startDate;

  EventModel({
    required this.id,
    required this.title,
    required this.location,
    required this.startDate,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['id'] as String,
      title: json['title'] as String,
      location: json['location'] as String,
      startDate: json['startDate'] as String,
    );
  }
}

final activeEventProvider = StateProvider<EventModel?>((ref) => null);

class EventListScreen extends ConsumerStatefulWidget {
  const EventListScreen({super.key});

  @override
  ConsumerState<EventListScreen> createState() => _EventListScreenState();
}

class _EventListScreenState extends ConsumerState<EventListScreen> {
  List<EventModel> _events = [];
  bool _isLoading = false;
  String? _error;
  final Map<String, bool> _syncingMap = {};
  final Map<String, int> _cacheCounts = {};

  @override
  void initState() {
    super.initState();
    Future.microtask(() => _fetchEvents());
  }

  Future<void> _fetchEvents() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get(ApiEndpoints.events);
      final data = response.data;
      if (data != null && data['success'] == true) {
        final list = data['data'] as List;
        if (mounted) {
          setState(() {
            _events = list.map((item) => EventModel.fromJson(item)).toList();
          });
        }
        await _loadLocalCacheCounts();
      } else {
        if (mounted) {
          setState(() {
            _error = data?['error']?['message'] ?? 'Gagal mengambil daftar event';
          });
        }
      }
    } on DioException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.response?.data?['error']?['message'] ?? 'Koneksi bermasalah';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Terjadi kesalahan sistem';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadLocalCacheCounts() async {
    final isar = ref.read(isarProvider);
    final counts = <String, int>{};
    for (final event in _events) {
      final count = await isar.ticketCaches.filter().eventIdEqualTo(event.id).count();
      counts[event.id] = count;
    }
    if (mounted) {
      setState(() {
        _cacheCounts.addAll(counts);
      });
    }
  }

  Future<void> _downloadManifest(EventModel event) async {
    setState(() {
      _syncingMap[event.id] = true;
    });

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get(ApiEndpoints.manifest(event.id));
      final data = response.data;

      if (data != null && data['success'] == true) {
        final ticketList = data['data'] as List;
        
        final isar = ref.read(isarProvider);
        await isar.writeTxn(() async {
          // Clear previous ticket cache for this event
          await isar.ticketCaches.filter().eventIdEqualTo(event.id).deleteAll();
          
          // Insert new ones
          final caches = ticketList.map((item) {
            return TicketCache()
              ..ticketId = item['ticketId'] as String
              ..eventId = event.id
              ..buyerName = (item['attendeeName'] ?? '') as String
              ..categoryName = (item['ticketCategoryName'] ?? '') as String
              ..status = 'VALID';
          }).toList();
          
          await isar.ticketCaches.putAll(caches);
        });

        if (mounted) {
          setState(() {
            _cacheCounts[event.id] = ticketList.length;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Berhasil mengunduh ${ticketList.length} tiket untuk "${event.title}"'),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data?['error']?['message'] ?? 'Gagal mengunduh manifest'),
              backgroundColor: const Color(0xFFEF4444),
            ),
          );
        }
      }
    } on DioException catch (e) {
      if (mounted) {
        final msg = e.response?.data?['error']?['message'] ?? 'Masalah koneksi internet';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Terjadi kesalahan penyimpanan lokal'),
            backgroundColor: Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _syncingMap[event.id] = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final email = ref.watch(authProvider).email ?? 'Gate Staff';

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Pilih Event Tugas',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.redAccent),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
          )
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchEvents,
        color: const Color(0xFF08B4B5),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Welcome Text
              Text(
                'Halo, $email',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Colors.grey),
              ),
              const SizedBox(height: 4),
              Text(
                'Daftar Event Aktif Anda',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
              ),
              const SizedBox(height: 20),

              // Error or Loading
              if (_isLoading)
                const Expanded(
                  child: Center(
                    child: CircularProgressIndicator(color: Color(0xFF08B4B5)),
                  ),
                )
              else if (_error != null)
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: _fetchEvents,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Theme.of(context).colorScheme.onSurface.withOpacity(0.05),
                            foregroundColor: Theme.of(context).colorScheme.onSurface,
                          ),
                          child: const Text('Coba Lagi'),
                        )
                      ],
                    ),
                  ),
                )
              else if (_events.isEmpty)
                const Expanded(
                  child: Center(
                    child: Text('Tidak ada event yang ditugaskan kepada Anda hari ini.', style: TextStyle(color: Colors.grey)),
                  ),
                )
              else
                Expanded(
                  child: ListView.builder(
                    itemCount: _events.length,
                    itemBuilder: (context, index) {
                      final event = _events[index];
                      final isSyncing = _syncingMap[event.id] ?? false;
                      final cacheCount = _cacheCounts[event.id] ?? 0;
                      
                      DateTime? parsedDate;
                      try {
                        parsedDate = DateTime.parse(event.startDate);
                      } catch (_) {}
                      
                      final dateStr = parsedDate != null
                          ? DateFormat('d MMMM yyyy, HH:mm').format(parsedDate)
                          : event.startDate;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        color: Theme.of(context).colorScheme.surface,
                        elevation: 2,
                        shadowColor: Colors.black.withOpacity(0.05),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: isSyncing
                              ? null
                              : () {
                                  ref.read(activeEventProvider.notifier).state = event;
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const ScannerScreen()),
                                  );
                                },
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Title & Access Indicator
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        event.title,
                                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
                                      ),
                                    ),
                                    const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                                  ],
                                ),
                                const SizedBox(height: 8),

                                // Location & Date
                                Row(
                                  children: [
                                    const Icon(Icons.calendar_month_outlined, size: 14, color: Colors.grey),
                                    const SizedBox(width: 6),
                                    Text(dateStr, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        event.location,
                                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),

                                // Manifest Download Sync Info
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    // Offline status badge
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: cacheCount > 0
                                            ? const Color(0xFF10B981).withOpacity(0.1)
                                            : Colors.amber.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(
                                          color: cacheCount > 0
                                              ? const Color(0xFF10B981).withOpacity(0.2)
                                              : Colors.amber.withOpacity(0.2),
                                        ),
                                      ),
                                      child: Text(
                                        cacheCount > 0 ? '$cacheCount tiket di-cache' : 'Belum di-cache',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: cacheCount > 0 ? const Color(0xFF10B981) : Colors.amber,
                                        ),
                                      ),
                                    ),

                                    // Download Button
                                    ElevatedButton.icon(
                                      onPressed: isSyncing ? null : () => _downloadManifest(event),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF08B4B5),
                                        foregroundColor: Colors.white,
                                        disabledBackgroundColor: const Color(0xFF08B4B5).withOpacity(0.4),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      ),
                                      icon: isSyncing
                                          ? const SizedBox(
                                              height: 12,
                                              width: 12,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                              ),
                                            )
                                          : const Icon(Icons.download_rounded, size: 14),
                                      label: Text(
                                        isSyncing ? 'Mengunduh' : 'Download Tiket',
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                )
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
