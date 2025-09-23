"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertChecker = exports.requestAnalytics = exports.documentAnalytics = exports.logRequestStatusChange = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
// Initialise Firebase Admin if not already initialised
if (!admin.apps.length) {
    admin.initializeApp();
}
// Import handlers and middleware
const logs_1 = require("./logs");
const stats_1 = require("./stats");
const alerts_1 = require("./alerts");
// Set up Express app
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(logs_1.authMiddleware);
// Route: POST /logs - record manual log entries
app.post('/logs', logs_1.createLogHandler);
// Route: GET /admin/logs - list log entries (admin only)
app.get('/admin/logs', stats_1.requireAdmin, logs_1.listLogsHandler);
// Route: GET /admin/stats - return aggregated stats (admin only)
app.get('/admin/stats', stats_1.requireAdmin, stats_1.getStatsHandler);
// Route: GET /admin/alerts - list alert documents (admin only)
app.get('/admin/alerts', stats_1.requireAdmin, alerts_1.getAlertsHandler);
// Export Express app as HTTPS function
exports.api = functions.https.onRequest(app);
// Export triggers so they are deployed
exports.logRequestStatusChange = logs_1.onRequestStatusChange;
exports.documentAnalytics = stats_1.onDocumentCreated;
exports.requestAnalytics = stats_1.onRequestWriteForAnalytics;
exports.alertChecker = alerts_1.scheduledAlertCheck;
//# sourceMappingURL=index.js.map