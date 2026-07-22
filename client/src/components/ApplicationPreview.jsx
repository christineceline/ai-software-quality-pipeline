function insertBeforeClosingTag(source, closingTag, content) {
  const lowerSource = source.toLowerCase();
  const index = lowerSource.lastIndexOf(closingTag.toLowerCase());

  if (index === -1) {
    return `${source}\n${content}`;
  }

  return `${source.slice(0, index)}${content}\n${source.slice(index)}`;
}

function buildPreviewDocument({ html, css, javascript }) {
  const safeJavaScript = javascript.replace(
    /<\/script/gi,
    "<\\/script",
  );

  let document = insertBeforeClosingTag(
    html,
    "</head>",
    `<style id="pipeline-preview-styles">\n${css}\n</style>`,
  );

  document = insertBeforeClosingTag(
    document,
    "</body>",
    `<script id="pipeline-preview-script">\n${safeJavaScript}\n</script>`,
  );

  return document;
}

function ApplicationPreview({ application }) {
  if (!application) {
    return (
      <div className="empty-state">
        Generate an application to display its preview.
      </div>
    );
  }

  const previewDocument = buildPreviewDocument(application);

  return (
    <iframe
      className="application-preview"
      title="Generated application preview"
      srcDoc={previewDocument}
      sandbox="allow-scripts allow-forms allow-modals"
    />
  );
}

export default ApplicationPreview;