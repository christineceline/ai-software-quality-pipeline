# Pilot validation fixes

Extract this archive into the repository root.

## Regenerate the existing pilot without new AI calls

```powershell
cd server
npm run experiment:export -- experiment-2026-08-03T09-36-29-927Z-a9300bbd
```

## Run a new one-repetition pilot

Keep the server running in the first terminal, then:

```powershell
cd server
npm run experiment -- 1
```

New experiments use reproducible seeded random ordering. The default seed is `77077`.

## Formal experiment example

```powershell
npm run experiment -- --repetitions=10 --seed=77077
```

The formal experiment configuration records the seed and run-order method.
