# CTO Infrastructure & Workflow Fixes Checklist

## Critical (Production-Ready Must-Haves)

- [ ] **Award Nominations**: Fix lead route success reporting
  - [ ] Check `ok` value from submitNomination
  - [ ] Persist attachments to private bucket instead of email
  - [ ] Return meaningful error responses

- [ ] **Membership Verification**:
  - [ ] Remove process-local code map
  - [ ] Store codes hashed in database
  - [ ] Remove plaintext code in reviewer_notes
  - [ ] Enforce server-side verification

- [ ] **Award Documents Security**:
  - [ ] Migrate awards-assets to private bucket
  - [ ] Create new migration to move files
  - [ ] Update attachment_url to private paths

- [ ] **Checkout Amount Safety**:
  - [ ] Add NaN validation in checkout route
  - [ ] Set safe defaults for memberDiscount fields
  - [ ] Add fallback values if CMS record missing fields

- [ ] **Secret Rotation**:
  - [ ] Check .env.example for real secrets
  - [ ] Replace with placeholder if found
  - [ ] Create rotation instructions if needed

- [ ] **Supabase Storage for Documents**:
  - [ ] Migrate local private_documents to Supabase Storage
  - [ ] Create migration script
  - [ ] Update file paths to use private bucket

## Medium Priority (Operational Reliability)

- [ ] **Stripe Return URL Validation**:
  - [ ] Validate Origin header against configured domains
  - [ ] Add domain whitelist check

- [ ] **Email Delivery Tracking**:
  - [ ] Check Resend return values
  - [ ] Add retry logic for rejected emails
  - [ ] Track delivery status in database

- [ ] **Migration Documentation**:
  - [ ] Document all missing migrations
  - [ ] Update setup guide with all SQL files
  - [ ] Add schema version verification

## Low Priority (Polish & Automation)

- [ ] **Test Suite**:
  - [ ] Add basic test script
  - [ ] Add lint script
  - [ ] Document testing approach

- [ ] **Build Validation**:
  - [ ] Confirm build passes on clean install
  - [ ] Document any environment prerequisites

## Tracking

- All fixes should be tested locally before commit
- Each fix should have a corresponding migration if schema changes
- Check git diff after each major section
- Run `npm run build` after complete changes
- Ensure no secrets remain in codebase