// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scan_log.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetScanLogCollection on Isar {
  IsarCollection<ScanLog> get scanLogs => this.collection();
}

const ScanLogSchema = CollectionSchema(
  name: r'ScanLog',
  id: -4582218631738629911,
  properties: {
    r'qrPayload': PropertySchema(
      id: 0,
      name: r'qrPayload',
      type: IsarType.string,
    ),
    r'scannedAt': PropertySchema(
      id: 1,
      name: r'scannedAt',
      type: IsarType.dateTime,
    ),
    r'status': PropertySchema(
      id: 2,
      name: r'status',
      type: IsarType.string,
    ),
    r'synced': PropertySchema(
      id: 3,
      name: r'synced',
      type: IsarType.bool,
    ),
    r'ticketId': PropertySchema(
      id: 4,
      name: r'ticketId',
      type: IsarType.string,
    )
  },
  estimateSize: _scanLogEstimateSize,
  serialize: _scanLogSerialize,
  deserialize: _scanLogDeserialize,
  deserializeProp: _scanLogDeserializeProp,
  idName: r'id',
  indexes: {},
  links: {},
  embeddedSchemas: {},
  getId: _scanLogGetId,
  getLinks: _scanLogGetLinks,
  attach: _scanLogAttach,
  version: '3.1.0+1',
);

int _scanLogEstimateSize(
  ScanLog object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.qrPayload.length * 3;
  bytesCount += 3 + object.status.length * 3;
  bytesCount += 3 + object.ticketId.length * 3;
  return bytesCount;
}

void _scanLogSerialize(
  ScanLog object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.qrPayload);
  writer.writeDateTime(offsets[1], object.scannedAt);
  writer.writeString(offsets[2], object.status);
  writer.writeBool(offsets[3], object.synced);
  writer.writeString(offsets[4], object.ticketId);
}

ScanLog _scanLogDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = ScanLog();
  object.id = id;
  object.qrPayload = reader.readString(offsets[0]);
  object.scannedAt = reader.readDateTime(offsets[1]);
  object.status = reader.readString(offsets[2]);
  object.synced = reader.readBool(offsets[3]);
  object.ticketId = reader.readString(offsets[4]);
  return object;
}

P _scanLogDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readDateTime(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readBool(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _scanLogGetId(ScanLog object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _scanLogGetLinks(ScanLog object) {
  return [];
}

void _scanLogAttach(IsarCollection<dynamic> col, Id id, ScanLog object) {
  object.id = id;
}

extension ScanLogQueryWhereSort on QueryBuilder<ScanLog, ScanLog, QWhere> {
  QueryBuilder<ScanLog, ScanLog, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension ScanLogQueryWhere on QueryBuilder<ScanLog, ScanLog, QWhereClause> {
  QueryBuilder<ScanLog, ScanLog, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterWhereClause> idNotEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterWhereClause> idGreaterThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterWhereClause> idLessThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterWhereClause> idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension ScanLogQueryFilter
    on QueryBuilder<ScanLog, ScanLog, QFilterCondition> {
  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> qrPayloadEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'qrPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> qrPayloadGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'qrPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> qrPayloadLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'qrPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> qrPayloadBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'qrPayload',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> qrPayloadStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'qrPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> qrPayloadEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'qrPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> qrPayloadContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'qrPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> qrPayloadMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'qrPayload',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> qrPayloadIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'qrPayload',
        value: '',
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> qrPayloadIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'qrPayload',
        value: '',
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> scannedAtEqualTo(
      DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'scannedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> scannedAtGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'scannedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> scannedAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'scannedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> scannedAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'scannedAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> statusEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> statusGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> statusLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> statusBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'status',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> statusStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> statusEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> statusContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> statusMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'status',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> statusIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'status',
        value: '',
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> statusIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'status',
        value: '',
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> syncedEqualTo(
      bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'synced',
        value: value,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> ticketIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'ticketId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> ticketIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'ticketId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> ticketIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'ticketId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> ticketIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'ticketId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> ticketIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'ticketId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> ticketIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'ticketId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> ticketIdContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'ticketId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> ticketIdMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'ticketId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> ticketIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'ticketId',
        value: '',
      ));
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterFilterCondition> ticketIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'ticketId',
        value: '',
      ));
    });
  }
}

extension ScanLogQueryObject
    on QueryBuilder<ScanLog, ScanLog, QFilterCondition> {}

extension ScanLogQueryLinks
    on QueryBuilder<ScanLog, ScanLog, QFilterCondition> {}

extension ScanLogQuerySortBy on QueryBuilder<ScanLog, ScanLog, QSortBy> {
  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> sortByQrPayload() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrPayload', Sort.asc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> sortByQrPayloadDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrPayload', Sort.desc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> sortByScannedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'scannedAt', Sort.asc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> sortByScannedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'scannedAt', Sort.desc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> sortBySynced() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'synced', Sort.asc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> sortBySyncedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'synced', Sort.desc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> sortByTicketId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ticketId', Sort.asc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> sortByTicketIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ticketId', Sort.desc);
    });
  }
}

extension ScanLogQuerySortThenBy
    on QueryBuilder<ScanLog, ScanLog, QSortThenBy> {
  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenByQrPayload() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrPayload', Sort.asc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenByQrPayloadDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrPayload', Sort.desc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenByScannedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'scannedAt', Sort.asc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenByScannedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'scannedAt', Sort.desc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenBySynced() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'synced', Sort.asc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenBySyncedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'synced', Sort.desc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenByTicketId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ticketId', Sort.asc);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QAfterSortBy> thenByTicketIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ticketId', Sort.desc);
    });
  }
}

extension ScanLogQueryWhereDistinct
    on QueryBuilder<ScanLog, ScanLog, QDistinct> {
  QueryBuilder<ScanLog, ScanLog, QDistinct> distinctByQrPayload(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'qrPayload', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QDistinct> distinctByScannedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'scannedAt');
    });
  }

  QueryBuilder<ScanLog, ScanLog, QDistinct> distinctByStatus(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<ScanLog, ScanLog, QDistinct> distinctBySynced() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'synced');
    });
  }

  QueryBuilder<ScanLog, ScanLog, QDistinct> distinctByTicketId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ticketId', caseSensitive: caseSensitive);
    });
  }
}

extension ScanLogQueryProperty
    on QueryBuilder<ScanLog, ScanLog, QQueryProperty> {
  QueryBuilder<ScanLog, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<ScanLog, String, QQueryOperations> qrPayloadProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'qrPayload');
    });
  }

  QueryBuilder<ScanLog, DateTime, QQueryOperations> scannedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'scannedAt');
    });
  }

  QueryBuilder<ScanLog, String, QQueryOperations> statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<ScanLog, bool, QQueryOperations> syncedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'synced');
    });
  }

  QueryBuilder<ScanLog, String, QQueryOperations> ticketIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ticketId');
    });
  }
}
