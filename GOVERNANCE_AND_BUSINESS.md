# Business Case & IT Governance Documentation
## Project: Digital Stock Opname & Asset Identification System

---

## 1. Business Case & Value Proposition

### 1.1 Problem Statement
Manual asset inventory management (Stock Opname) was time-consuming, prone to human error, and lacked real-time visibility. The absence of a standardized physical identification system (Barcodes) led to difficulties in tracking asset movement and verification.

### 1.2 Business Objectives
- **Operational Efficiency**: Reduce the time required for physical audits by up to 60% through barcode automation.
- **Data Integrity**: Eliminate manual data entry errors by implementing direct database updates via scanning.
- **Accountability**: Create a clear audit trail of who performed the check and when the asset was last verified.
- **Cost Reduction**: Minimize asset loss and duplicate purchases by maintaining an accurate, real-time inventory.

### 1.3 Key Performance Indicators (KPIs)
- **Audit Completion Time**: Total duration of a Stock Opname session.
- **Accuracy Rate**: Discrepancy percentage between physical found items vs. system records.
- **Asset Identification Coverage**: Percentage of assets labeled with active barcodes.

---

## 2. IT Governance & Risk Management

### 2.1 Access Control & Security
- **Role-Based Access**: Access to create and delete Stock Opname sessions is restricted to the General Affairs (GA) administrator role.
- **Environment Isolation**: Database credentials are managed via secure environment variables (`.env.local`), ensuring no sensitive data is committed to Version Control (Git).
- **Network Security**: Database connections utilize SSL and are restricted via IP whitelisting on Supabase.

### 2.2 Data Integrity & Architecture
- **Relational Integrity**: Foreign Key constraints ensure that every inventory check is linked to a valid asset and session.
- **Schema Management**: All GA-related data is isolated within the `ga` schema, preventing unauthorized access or accidental modification from other system modules.
- **Transaction Safety**: The system utilizes PostgreSQL transactions for critical operations (e.g., session creation) to ensure data consistency in case of hardware or network failure.

### 2.3 System Availability & Scalability
- **Connection Pooling**: Implementation of the **Transaction Pooler** (Port 6543) ensures the system remains responsive even during peak usage periods (e.g., nationwide audit sessions).
- **Scalability**: The architecture supports multi-company and multi-category filtering, allowing the system to scale as the organization grows.

### 2.4 Compliance & Audit Trail
- **Traceability**: Every asset scan is timestamped (`last_scanned_at`), providing a historical record for internal and external auditors.
- **Data Retention**: Deletion of sessions requires manual confirmation, preventing accidental data loss of historical audit records.
- **Version Control**: All code changes are tracked via Git, providing a full history of the application's evolution and governance changes.

---

## 3. Maintenance & Support

- **Database Backups**: Automated backups are handled via Supabase (Point-in-Time Recovery).
- **Monitoring**: Error logging is implemented in API routes to capture and resolve potential database connection issues or logic errors.
- **Documentation**: Technical and Business documentation is maintained in the repository root for continuous knowledge transfer.
