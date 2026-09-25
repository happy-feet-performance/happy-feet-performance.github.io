// Sub-view rendered by HF_ADMIN.viewTicketUser() -- wraps the shared
// HF_ROLE_UTILS.viewProfile() HTML (with its own embedded "Back" button
// that calls HF_ROUTER.navTo('tickets')) in a React shell.
export default function TicketUserProfile({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
