const POPULATE_LIST = [
  { path: 'item', select: 'itemCode name description' },
  { path: 'bom', select: 'bomCode' },
  { path: 'steps.operation', select: 'operationCode operationName workCenter routingType' },
  { path: 'steps.previousOperation', select: 'operationCode operationName' },
  { path: 'firstScanOperation', select: 'operationCode operationName' },
  { path: 'lastScanOperation', select: 'operationCode operationName' },
  { path: 'createdBy', select: 'name userId' },
  { path: 'versionHistory.steps.operation', select: 'operationCode operationName workCenter routingType' },
  { path: 'versionHistory.steps.previousOperation', select: 'operationCode operationName' },
  { path: 'versionHistory.firstScanOperation', select: 'operationCode operationName' },
  { path: 'versionHistory.lastScanOperation', select: 'operationCode operationName' },
];

const normalizeSteps = (arr) =>
  (arr || []).map((s) => ({
    operation: String(s.operation?._id || s.operation || ''),
    sequenceNo: s.sequenceNo,
    stage: s.stage,
    previousOperation: String(s.previousOperation?._id || s.previousOperation || ''),
    type: s.type,
    scan: s.scan,
  }));