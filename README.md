# Paperless Tag FUSE

A FUSE filesystem that creates a dynamic, tag-based view of your `Paperless-ngx` documents. Browse and navigate your document collection by tags using any file manager or command-line tools.
Makes for a great Samba share.

## Features

- **Tag-based Navigation**: Filter documents for tags by navigating in a folder structure
- **Real-time Synchronization**: Webhook integration keeps the virtual filesystem in sync with Paperless-ngx

## How it Works

When mounted on `/your/mountpoint`, the filesystem provides:

- `/your/mountpoint/` - Contains all tags as folders and all documents as symlinks
- `/your/mountpoint/tag1/` - Shows remaining tags as folders and documents filtered by `tag1`
- `/your/mountpoint/tag1/tag2/` - Shows remaining tags as folders and documents filtered by both `tag1` and `tag2`

Tags act as progressive filters - navigate deeper into tag combinations to narrow down your document search.

## Prerequisites

- Node.js (v22 or later)
- Linux system with FUSE support
- Paperless-ngx instance with API access
- FUSE development libraries installed

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd paperless-tag-fuse
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env .env.local
   ```

4. **Edit configuration** in `.env.local`:

   ```env
   TOKEN="your-paperless-api-token"
   PAPERLESS_URL="https://your-paperless-instance.com"
   WEBHOOK_PORT=3000
   TARGET_DIR="./mnt"
   PAPERLESS_MEDIA_ROOT="/path/to/paperless/media"
   ```

5. **Start the filesystem**
   ```bash
   npm start
   ```

## Configuration

Configure the application using environment variables in `.env.local`:

| Variable                       | Description                                | Default    |
| ------------------------------ | ------------------------------------------ | ---------- |
| `TOKEN`                        | Paperless-ngx API token                    | _Required_ |
| `PAPERLESS_URL`                | Base URL of your Paperless-ngx instance    | _Required_ |
| `WEBHOOK_PORT`                 | Port for webhook server                    | `3000`     |
| `TARGET_DIR`                   | Mount point directory                      | `./mnt`    |
| `PAPERLESS_MEDIA_ROOT`         | Path to Paperless media files              | _Required_ |
| `FUSE_FORCE`                   | Force mount even if directory not empty    | `true`     |
| `FUSE_MKDIR`                   | Create mount directory if it doesn't exist | `true`     |
| `FUSE_DEBUG`                   | Enable FUSE debugging                      | `false`    |
| `FUSE_ALLOW_OTHER`             | Allow other users to access the mount      | `false`    |
| `DEBUG_TAGFS`                  | Enable TagFS debugging                     | `false`    |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Reject unauthorized TLS certificates       | `1`        |

## Webhook Integration

The application includes a webhook server for real-time synchronization with Paperless-ngx. Configure these webhooks in your Paperless-ngx admin panel:

| Event            | Webhook URL                                | Body        |
| ---------------- | ------------------------------------------ | ----------- |
| Document Added   | `http://your-server:3000/document/added`   | `{doc_url}` |
| Document Updated | `http://your-server:3000/document/updated` | `{doc_url}` |

The integration supports more possible webhooks, although those are not supported by Paperless yet.
Use these as they become available.
For now, you will need to restart the file system after adding or deleting tags to your Paperless installation.

| Event            | Webhook URL                                | Body        |
| ---------------- | ------------------------------------------ | ----------- |
| Document Added   | `http://your-server:3000/document/added`   | `{doc_url}` |
| Document Updated | `http://your-server:3000/document/updated` | `{doc_url}` |
| Document Deleted | `http://your-server:3000/document/deleted` | `{doc_url}` |
| Tag Added        | `http://your-server:3000/tag/added`        | Any         |
| Tag Modified     | `http://your-server:3000/tag/modified`     | Any         |
| Tag Deleted      | `http://your-server:3000/tag/deleted`      | Any         |

## Development

- **Type checking**: `npm run check`
- **Run tests**: `npm run test`
- **Start development**: `npm start`

## Usage Examples

```bash
# List all tags and documents
ls /your/mountpoint/

# Browse documents tagged with "invoice"
ls /your/mountpoint/invoice/

# Find documents tagged with both "invoice" and "2024"
ls /your/mountpoint/invoice/2024/
```

## Troubleshooting

- **Mount fails**: Ensure FUSE is installed and the target directory exists
- **No documents visible**: Check `PAPERLESS_MEDIA_ROOT` path and API token
- **Permission errors**: Check file permissions and consider `FUSE_ALLOW_OTHER` setting

## License

MIT License
