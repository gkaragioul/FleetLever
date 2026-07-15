# Public demo workspace

FleetLever's commercial header will replace the passive "Request a demo" action with an interactive "Try the app" action. The action creates a private, high-entropy demo session and opens the full FleetLever console in a near-full-screen modal over a blurred marketing page.

Each demo session lasts ten hours. The modal and standalone shared view show the remaining time, a copyable share link, an open-in-new-tab action, and a close action. The shared link opens the same temporary workspace, including changes made in the console.

Demo state is isolated from authenticated console state. A session-specific API stores the console snapshot, rejects expired sessions, and deletes expired content opportunistically. Local browser state uses a session-specific key and is removed when the session expires. File uploads are simulated inside public demos so temporary visitors cannot write to the production document store.

The public route is `/try/[sessionId]`; the embedded version uses the same route with `?embed=1`. Expired or invalid sessions show a clear expiry screen and a way to create a new workspace.

Verification covers session creation, shared state access, ten-hour expiry metadata, the header modal, mobile sizing, keyboard dismissal, no overflow, and the existing commercial and edition contracts.
