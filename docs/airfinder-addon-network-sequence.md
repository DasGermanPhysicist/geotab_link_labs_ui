# Airfinder Add-In

URL: https://geotab.link-labs.com


## SSO Process

Access API: https://access-conductor.link-labs.com


```mermaid
sequenceDiagram
    participant Airfinder Add-In
    participant My Geotab

    My Geotab->>Airfinder Add-In: initialize
    Airfinder Add-In->>+Access API: /access/geotab/sso
    Access API->>My Geotab: Geotab Session Id
    alt authenticated
        My Geotab->>Access API: Authenticated
        Access API->>-Airfinder Add-In: Link Labs Token
    else unauthenticated
        My Geotab-xAccess API: Unauthenticated
        Access API-xAirfinder Add-In: Unauthenticated
    end
```

## Link Labs Data

Network Asset API: https://networkasset-conductor.link-labs.com


- GET: Airfinder Organizations (`/networkAsset/airfinder/organizations`)
- GET: Airfinder Sites
  - `/networkAsset/airfinder/sites`
  - `/networkAsset/airfinder/organization/${organizationId}/sites`
- GET: Airfinder Tags (`/networkAsset/airfinder/v4/tags?${params}`)

```mermaid
sequenceDiagram
    Airfinder Add-In-->>+Network Asset API: Link Labs Requests
    Network Asset API-->>-Airfinder Add-In: Link Labs Responses
```
