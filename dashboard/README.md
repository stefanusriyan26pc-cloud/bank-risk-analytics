# Credit Risk Dashboard

Interactive portfolio frontend for the applicant-level credit-risk case study.
It consumes curated aggregates from `src/data/portfolio.json` and exports as a
fully static site compatible with GitHub Pages.

## Development

```bash
npm install
npm run dev
```

Open <http://localhost:3000> in a browser.

## Production export

```bash
npm run lint
npm run build
```

The generated site is written to `out/`. In GitHub Actions, `basePath` and
`assetPrefix` are derived from `GITHUB_REPOSITORY`: project Pages use their
repository path, while account and organization Pages are served from `/`.
