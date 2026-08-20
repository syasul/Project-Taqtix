// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ticket_cache.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetTicketCacheCollection on Isar {
  IsarCollection<TicketCache> get ticketCaches => this.collection();
}

const TicketCacheSchema = CollectionSchema(
  name: r'TicketCache',
  id: -788512844551600482,
  properties: {
    r'buyerName': PropertySchema(
      id: 0,
      name: r'buyerName',
      type: IsarType.string,
    ),
    r'categoryName': PropertySchema(
      id: 1,
      name: r'categoryName',
      type: IsarType.string,
    ),
    r'eventId': PropertySchema(
      id: 2,
      name: r'eventId',
      type: IsarType.string,
    ),
    r'qrPayload': PropertySchema(
      id: 3,
      name: r'qrPayload',
      type: IsarType.string,
    ),
    r'status': PropertySchema(
      id: 4,
      name: r'status',
      type: IsarType.string,
    ),
    r'ticketId': PropertySchema(
      id: 5,
      name: r'ticketId',
      type: IsarType.string,
    )
  },
  estimateSize: _ticketCacheEstimateSize,
  serialize: _ticketCacheSerialize,
  deserialize: _ticketCacheDeserialize,
  deserializeProp: _ticketCacheDeserializeProp,
  idName: r'id',
  indexes: {
    r'ticketId': IndexSchema(
      id: -6483959237056329942,
      name: r'ticketId',
      unique: true,
      replace: true,
      properties: [
        IndexPropertySchema(
          name: r'ticketId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _ticketCacheGetId,
  getLinks: _ticketCacheGetLinks,
  attach: _ticketCacheAttach,
  version: '3.1.0+1',
);

int _ticketCacheEstimateSize(
  TicketCache object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.buyerName.length * 3;
  bytesCount += 3 + object.categoryName.length * 3;
  bytesCount += 3 + object.eventId.length * 3;
  bytesCount += 3 + object.qrPayload.length * 3;
  bytesCount += 3 + object.status.length * 3;
  bytesCount += 3 + object.ticketId.length * 3;
  return bytesCount;
}

void _ticketCacheSerialize(
  TicketCache object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.buyerName);
  writer.writeString(offsets[1], object.categoryName);
  writer.writeString(offsets[2], object.eventId);
  writer.writeString(offsets[3], object.qrPayload);
  writer.writeString(offsets[4], object.status);
  writer.writeString(offsets[5], object.ticketId);
}

TicketCache _ticketCacheDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = TicketCache();
  object.buyerName = reader.readString(offsets[0]);
  object.categoryName = reader.readString(offsets[1]);
  object.eventId = reader.readString(offsets[2]);
  object.id = id;
  object.qrPayload = reader.readString(offsets[3]);
  object.status = reader.readString(offsets[4]);
  object.ticketId = reader.readString(offsets[5]);
  return object;
}

P _ticketCacheDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _ticketCacheGetId(TicketCache object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _ticketCacheGetLinks(TicketCache object) {
  return [];
}

void _ticketCacheAttach(
    IsarCollection<dynamic> col, Id id, TicketCache object) {
  object.id = id;
}

extension TicketCacheByIndex on IsarCollection<TicketCache> {
  Future<TicketCache?> getByTicketId(String ticketId) {
    return getByIndex(r'ticketId', [ticketId]);
  }

  TicketCache? getByTicketIdSync(String ticketId) {
    return getByIndexSync(r'ticketId', [ticketId]);
  }

  Future<bool> deleteByTicketId(String ticketId) {
    return deleteByIndex(r'ticketId', [ticketId]);
  }

  bool deleteByTicketIdSync(String ticketId) {
    return deleteByIndexSync(r'ticketId', [ticketId]);
  }

  Future<List<TicketCache?>> getAllByTicketId(List<String> ticketIdValues) {
    final values = ticketIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'ticketId', values);
  }

  List<TicketCache?> getAllByTicketIdSync(List<String> ticketIdValues) {
    final values = ticketIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'ticketId', values);
  }

  Future<int> deleteAllByTicketId(List<String> ticketIdValues) {
    final values = ticketIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'ticketId', values);
  }

  int deleteAllByTicketIdSync(List<String> ticketIdValues) {
    final values = ticketIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'ticketId', values);
  }

  Future<Id> putByTicketId(TicketCache object) {
    return putByIndex(r'ticketId', object);
  }

  Id putByTicketIdSync(TicketCache object, {bool saveLinks = true}) {
    return putByIndexSync(r'ticketId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByTicketId(List<TicketCache> objects) {
    return putAllByIndex(r'ticketId', objects);
  }

  List<Id> putAllByTicketIdSync(List<TicketCache> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'ticketId', objects, saveLinks: saveLinks);
  }
}

extension TicketCacheQueryWhereSort
    on QueryBuilder<TicketCache, TicketCache, QWhere> {
  QueryBuilder<TicketCache, TicketCache, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension TicketCacheQueryWhere
    on QueryBuilder<TicketCache, TicketCache, QWhereClause> {
  QueryBuilder<TicketCache, TicketCache, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterWhereClause> idNotEqualTo(
      Id id) {
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

  QueryBuilder<TicketCache, TicketCache, QAfterWhereClause> idGreaterThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterWhereClause> idLessThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterWhereClause> idBetween(
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

  QueryBuilder<TicketCache, TicketCache, QAfterWhereClause> ticketIdEqualTo(
      String ticketId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'ticketId',
        value: [ticketId],
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterWhereClause> ticketIdNotEqualTo(
      String ticketId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'ticketId',
              lower: [],
              upper: [ticketId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'ticketId',
              lower: [ticketId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'ticketId',
              lower: [ticketId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'ticketId',
              lower: [],
              upper: [ticketId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension TicketCacheQueryFilter
    on QueryBuilder<TicketCache, TicketCache, QFilterCondition> {
  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      buyerNameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'buyerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      buyerNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'buyerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      buyerNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'buyerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      buyerNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'buyerName',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      buyerNameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'buyerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      buyerNameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'buyerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      buyerNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'buyerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      buyerNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'buyerName',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      buyerNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'buyerName',
        value: '',
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      buyerNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'buyerName',
        value: '',
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      categoryNameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'categoryName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      categoryNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'categoryName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      categoryNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'categoryName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      categoryNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'categoryName',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      categoryNameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'categoryName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      categoryNameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'categoryName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      categoryNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'categoryName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      categoryNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'categoryName',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      categoryNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'categoryName',
        value: '',
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      categoryNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'categoryName',
        value: '',
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> eventIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'eventId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      eventIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'eventId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> eventIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'eventId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> eventIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'eventId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      eventIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'eventId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> eventIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'eventId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> eventIdContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'eventId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> eventIdMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'eventId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      eventIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'eventId',
        value: '',
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      eventIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'eventId',
        value: '',
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> idGreaterThan(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> idLessThan(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> idBetween(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      qrPayloadEqualTo(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      qrPayloadGreaterThan(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      qrPayloadLessThan(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      qrPayloadBetween(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      qrPayloadStartsWith(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      qrPayloadEndsWith(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      qrPayloadContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'qrPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      qrPayloadMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'qrPayload',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      qrPayloadIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'qrPayload',
        value: '',
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      qrPayloadIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'qrPayload',
        value: '',
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> statusEqualTo(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      statusGreaterThan(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> statusLessThan(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> statusBetween(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      statusStartsWith(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> statusEndsWith(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> statusContains(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> statusMatches(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      statusIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'status',
        value: '',
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      statusIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'status',
        value: '',
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> ticketIdEqualTo(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      ticketIdGreaterThan(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      ticketIdLessThan(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> ticketIdBetween(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      ticketIdStartsWith(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      ticketIdEndsWith(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      ticketIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'ticketId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition> ticketIdMatches(
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

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      ticketIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'ticketId',
        value: '',
      ));
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterFilterCondition>
      ticketIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'ticketId',
        value: '',
      ));
    });
  }
}

extension TicketCacheQueryObject
    on QueryBuilder<TicketCache, TicketCache, QFilterCondition> {}

extension TicketCacheQueryLinks
    on QueryBuilder<TicketCache, TicketCache, QFilterCondition> {}

extension TicketCacheQuerySortBy
    on QueryBuilder<TicketCache, TicketCache, QSortBy> {
  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> sortByBuyerName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerName', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> sortByBuyerNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerName', Sort.desc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> sortByCategoryName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'categoryName', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy>
      sortByCategoryNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'categoryName', Sort.desc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> sortByEventId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eventId', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> sortByEventIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eventId', Sort.desc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> sortByQrPayload() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrPayload', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> sortByQrPayloadDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrPayload', Sort.desc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> sortByTicketId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ticketId', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> sortByTicketIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ticketId', Sort.desc);
    });
  }
}

extension TicketCacheQuerySortThenBy
    on QueryBuilder<TicketCache, TicketCache, QSortThenBy> {
  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByBuyerName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerName', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByBuyerNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerName', Sort.desc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByCategoryName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'categoryName', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy>
      thenByCategoryNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'categoryName', Sort.desc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByEventId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eventId', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByEventIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eventId', Sort.desc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByQrPayload() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrPayload', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByQrPayloadDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrPayload', Sort.desc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByTicketId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ticketId', Sort.asc);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QAfterSortBy> thenByTicketIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ticketId', Sort.desc);
    });
  }
}

extension TicketCacheQueryWhereDistinct
    on QueryBuilder<TicketCache, TicketCache, QDistinct> {
  QueryBuilder<TicketCache, TicketCache, QDistinct> distinctByBuyerName(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'buyerName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QDistinct> distinctByCategoryName(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'categoryName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QDistinct> distinctByEventId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'eventId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QDistinct> distinctByQrPayload(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'qrPayload', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QDistinct> distinctByStatus(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<TicketCache, TicketCache, QDistinct> distinctByTicketId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ticketId', caseSensitive: caseSensitive);
    });
  }
}

extension TicketCacheQueryProperty
    on QueryBuilder<TicketCache, TicketCache, QQueryProperty> {
  QueryBuilder<TicketCache, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<TicketCache, String, QQueryOperations> buyerNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'buyerName');
    });
  }

  QueryBuilder<TicketCache, String, QQueryOperations> categoryNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'categoryName');
    });
  }

  QueryBuilder<TicketCache, String, QQueryOperations> eventIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'eventId');
    });
  }

  QueryBuilder<TicketCache, String, QQueryOperations> qrPayloadProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'qrPayload');
    });
  }

  QueryBuilder<TicketCache, String, QQueryOperations> statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<TicketCache, String, QQueryOperations> ticketIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ticketId');
    });
  }
}
