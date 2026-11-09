# Amelia research-copy checkpoint

This is a read-only recovery copy of the Supabase research-copy runtime checkpoint, not the separate Outside Streams ledger.

- Source: project `supabase-scarlet-amelia`, table `public.amelia_research_records`, store `runtime`, record ID `live-checkpoint`.
- Source row updated: 2026-11-09 09:13:59.622 UTC; payload revision 12.
- Contents: runtime step 204, 204 runtime memory events, and the embedded live-field checkpoint at field step 168.
- Embedded field payload SHA-256: `762e335209439cf59dcd8ba674b2ec92ad9e1129237f41e5485685d5266c224c`; this matches its stored checksum.
- File: `live-checkpoint.json`, 4,013,785 bytes. SHA-256: `4aa72598810d04436bc99371f4c545dea244ec7d7040cfdf4eaf04cf27938ab0`.

The file is exactly the UTF-8 encoding of PostgreSQL's `payload::text` for that row, with no added newline. The original JSONB value was not altered. PostgreSQL JSONB does not retain the original uploaded JSON's whitespace or object-key order; the file checksum identifies this database serialization, not the original upload bytes.

The file preserves the runtime checkpoint as stored. It has not been shown to be identical to the tablet's separate Export PFM format, or to include data held only on the device. This copy does not repair or test the tablet export button.
