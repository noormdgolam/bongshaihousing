const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
<script>
document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return true;
  }
  e.preventDefault();
  return false;
});
</script>
</body>
</html>
`, { runScripts: 'dangerously' });
const window = dom.window;
const document = window.document;

const event = new window.MouseEvent('contextmenu', {
  bubbles: true,
  cancelable: true
});
document.body.dispatchEvent(event);
console.log('defaultPrevented:', event.defaultPrevented);
