# Profile Content Updater Rule

This rule updates time-sensitive content in profile JSON files including Joule prompts, SAP Notes, shortcuts, and documentation links.

**Trigger phrase**: "update profile content" or "/update-profiles" or "refresh profile data"

**Last Updated**: 2026-01-11 (Q1 2026)

## MISSION

Keep profile JSON files current with:
- Latest Joule AI prompts (SuccessFactors, S/4HANA, BTP)
- Current SAP Note references
- Updated documentation URLs
- New product features and shortcuts
- Release-specific information

## CONTENT VERSION TRACKING

Each profile JSON file should have a "version" field at the top level and "contentVersion" in notes:

```json
{
  "version": "2.0",
  "contentVersion": "2026-Q1",
  "lastUpdated": "2026-01-11",
  "notes": [
    {
      "title": "🤖 Joule Prompts Library - SuccessFactors",
      "content": "...",
      "contentVersion": "2026-Q1",
      "lastVerified": "2026-01-11"
    }
  ]
}
```

## UPDATE WORKFLOW

### Step 1: Check Current Versions

```bash
# Check version fields in all profile JSONs
grep -A 2 '"version"\|"contentVersion"' resources/profile-*.json
```

### Step 2: Identify Outdated Content

Review these time-sensitive areas:
- [ ] Joule prompt examples (tied to product release)
- [ ] SAP Note numbers (new notes added quarterly)
- [ ] Documentation URLs (can change with site updates)
- [ ] API endpoints and rate limits
- [ ] Quick Actions paths (tied to UI changes)

### Step 3: Update with Real-Time Search

Use MCP tools to fetch current information:

```javascript
// Use ragmire searchweb or perplexity-search MCP tools
// Example queries:

"Latest SAP Joule prompts for SuccessFactors 2026"
"New SAP SuccessFactors features Q1 2026"
"SAP S/4HANA Joule use cases 2026"
"SAP BTP AI Core latest capabilities"
```

### Step 4: Update Each Profile

#### Profile: resources/profile-global.json

**Content to Update**:
- [ ] Joule activation SAP Notes (check for newer versions)
- [ ] Universal Joule prompt best practices
- [ ] BTP Generative AI Hub setup (version-dependent)

**Search Query**: "SAP Joule activation 2026 latest SAP Notes"

#### Profile: resources/profile-successfactors.json

**Content to Update**:
- [ ] Joule Prompts Library note (solution-specific examples)
- [ ] Essential SF SAP Notes (check for deprecations)
- [ ] Quick Actions paths (verify against latest UI)
- [ ] Product roadmap URL (updates quarterly)

**Search Queries**:
- "SAP SuccessFactors Joule prompts 2026"
- "SAP SuccessFactors most referenced SAP Notes 2026"
- "SuccessFactors H1 2026 new features"

#### Profile: resources/profile-s4hana.json

**Content to Update**:
- [ ] Joule Prompts Library (Finance & ERP use cases)
- [ ] Clean Core best practices
- [ ] S/4HANA Cloud latest SAP Notes

**Search Queries**:
- "SAP S/4HANA Joule finance prompts 2026"
- "S/4HANA Clean Core migration SAP Notes 2026"
- "S/4HANA Cloud 2026 new capabilities"

#### Profile: resources/profile-btp.json

**Content to Update**:
- [ ] Joule Studio capabilities (frequent updates)
- [ ] AI Core model availability (new models added monthly)
- [ ] CAP development patterns with Joule

**Search Queries**:
- "SAP BTP Joule Studio 2026 features"
- "BTP AI Core foundation models 2026"
- "SAP Build Code with Joule 2026"

#### Profile: resources/profile-executive.json

**Content to Update**:
- [ ] Latest business value metrics
- [ ] Current competitive positioning
- [ ] Recent customer success stories

**Search Queries**:
- "SAP SuccessFactors business value 2026"
- "SAP vs Workday comparison 2026"

### Step 5: Version Bump

After updates, increment version fields:

```json
{
  "version": "2.0",
  "contentVersion": "2026-Q2",  // Increment quarter
  "lastUpdated": "2026-04-15",   // Update date
  "notes": [
    {
      "title": "🤖 Joule Prompts Library",
      "contentVersion": "2026-Q2",
      "lastVerified": "2026-04-15"
    }
  ]
}
```

## CONTENT UPDATE SCHEDULE

**Quarterly Updates** (Recommended):
- Q1 (Jan): After year-end product updates
- Q2 (Apr): After H1 releases
- Q3 (Jul): After mid-year releases  
- Q4 (Oct): Before year-end planning

**Triggered Updates**:
- Major product release (e.g., SuccessFactors H1 2026)
- New Joule capabilities announced
- API changes or deprecations
- SAP Note updates affecting workflows

## VERIFICATION CHECKLIST

After updating content:

- [ ] All SAP Note URLs are reachable (not 404)
- [ ] Joule prompts tested against latest product version
- [ ] Documentation links point to current pages
- [ ] Quick Actions paths verified in live system
- [ ] Version numbers incremented
- [ ] contentVersion and lastVerified fields updated

## EXAMPLE: Updating Joule Prompts

**Before** (Outdated):
```json
{
  "title": "🤖 Joule Prompts - SuccessFactors",
  "content": "Old prompts from 2024...",
  "contentVersion": "2024-Q4"
}
```

**After** (Current):
```json
{
  "title": "🤖 Joule Prompts Library - SuccessFactors",
  "content": "=== Manager & Performance ===\n• \"Summarize this employee's goal progress for H1 2026...\"\n\n[Latest 2026 examples]",
  "contentVersion": "2026-Q1",
  "lastVerified": "2026-01-11"
}
```

## INTEGRATION WITH OTHER RULES

**Workflow**:
1. Run `/update-profiles` to refresh content (this rule)
2. Run `/security` to check for sensitive data
3. Run `/cleanup` for code quality
4. Commit and push

## NOTES FOR CLINE

- Use ragmire searchweb MCP tool for real-time web search
- Prioritize official SAP sources (help.sap.com, community.sap.com)
- Verify all URLs before adding to profiles
- Keep prompts actionable and specific
- Update version fields after every content change
- Document what was updated in commit message
