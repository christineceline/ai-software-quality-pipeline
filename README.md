# Final experiment safeguards

Extract into the repository root.

## Final pilot

Start the server, then:

```powershell
cd server
npm run experiment -- --repetitions=1 --seed=77077
```

The new manifest must include:

- `runOrder: "seeded-random"`
- `randomSeed: 77077`
- `preflightCheckedAt`
- `reproducibility.combinedSha256`

## Validate the completed pilot

```powershell
npm run experiment:validate -- experiment-...
```

## Resume

```powershell
npm run experiment -- --experiment-id=experiment-...
```

Resume is blocked if the provider, model, refinement limit, or reproducibility fingerprint differs from the original manifest.
