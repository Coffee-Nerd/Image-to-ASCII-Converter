import ImprovedAsciiArtConverter from '@/components/ascii-art-converter'

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <h1 className="text-3xl font-bold text-center mb-8">ASCII Art Converter</h1>
      <ImprovedAsciiArtConverter />
    </main>
  )
}