export function PublishedDeckFrame({
  src,
  title,
}: {
  src: string
  title: string
}) {
  return (
    <main style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      <iframe
        src={src}
        title={title}
        style={{
          border: "none",
          width: "100%",
          height: "100%",
        }}
      />
    </main>
  )
}
