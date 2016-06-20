
require('<%- blah %>');

<% _.forEach(functions, fn => { %>
function <%- fn.name %>() {
  console.log("<%- fn.log %>");
}
<% }) %>