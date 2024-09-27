"use client"

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

const ASCII_CHARS = ['@', '&', '#', '%', '/', '*', '(', ')', '=', '+', '-', ':', ',', '.', ' ']

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function rgbToAnsi256(r: number, g: number, b: number): number {
  if (r === g && g === b) {
    if (r < 8) return 16
    if (r > 248) return 231
    return Math.round(((r - 8) / 247) * 24) + 232
  }
  return 16 +
    (36 * Math.round(r / 255 * 5)) +
    (6 * Math.round(g / 255 * 5)) +
    Math.round(b / 255 * 5)
}

const ImprovedAsciiArtConverter: React.FC = () => {
  const [asciiArt, setAsciiArt] = useState<string>('')
  const [coloredAsciiArt, setColoredAsciiArt] = useState<string>('')
  const [colorCodedAsciiArt, setColorCodedAsciiArt] = useState<string>('')
  const [width, setWidth] = useState<number>(80)
  const [height, setHeight] = useState<number>(0)
  const [aspectRatio, setAspectRatio] = useState<number>(0)
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme, setTheme } = useTheme()

  const convertToAscii = (imageUrl: string) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const imgAspectRatio = img.height / img.width
      setAspectRatio(imgAspectRatio)
      
      let newWidth = width
      let newHeight = height > 0 ? height : Math.round(width * imgAspectRatio)

      canvas.width = newWidth
      canvas.height = newHeight

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data

        let ascii = ''
        let colored = ''
        let colorCoded = ''
        let lastColorCode = ''

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4
            if (i >= pixels.length) continue // Skip if we're out of bounds

            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            const a = pixels[i + 3]

            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            const charIndex = Math.floor(brightness * (ASCII_CHARS.length - 1))
            const char = ASCII_CHARS[charIndex]

            if (a === 0 || (r === 0 && g === 0 && b === 0)) {
              ascii += ' '
              colored += ' '
              colorCoded += ' '
            } else {
              ascii += char
              const hexColor = rgbToHex(r, g, b)
              colored += `<span style="color: ${hexColor}">${char}</span>`
              const ansiColor = rgbToAnsi256(r, g, b)
              const colorCode = `$x${ansiColor.toString().padStart(3, '0')}`
              if (colorCode !== lastColorCode) {
                colorCoded += colorCode
                lastColorCode = colorCode
              }
              colorCoded += char
            }
          }
          ascii += '\n'
          colored += '<br>'
          colorCoded += '\n'
          lastColorCode = '' // Reset color code at the end of each line
        }

        setAsciiArt(ascii)
        setColoredAsciiArt(colored)
        setColorCodedAsciiArt(colorCoded)
        setError('')
      } catch (err) {
        setError('Error processing image. Please try a different image or adjust the dimensions.')
        console.error(err)
      }
    }
    img.onerror = () => {
      setError('Error loading image. Please try a different image.')
    }
    img.src = imageUrl
    setCurrentImageUrl(imageUrl)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          convertToAscii(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth)
    if (maintainAspectRatio && aspectRatio > 0) {
      setHeight(Math.round(newWidth * aspectRatio))
    }
  }

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight)
    if (maintainAspectRatio && aspectRatio > 0) {
      setWidth(Math.round(newHeight / aspectRatio))
    }
  }

  const handleConvertAgain = () => {
    if (currentImageUrl) {
      convertToAscii(currentImageUrl)
    }
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-background text-foreground">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">ASCII Art Converter</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Input type="file" onChange={handleFileUpload} accept="image/*" />
            <div className="flex items-center space-x-2">
              <Switch
                id="aspect-ratio"
                checked={maintainAspectRatio}
                onCheckedChange={setMaintainAspectRatio}
              />
              <Label htmlFor="aspect-ratio">Maintain Aspect Ratio</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width-slider">Width: {width} characters</Label>
                <Slider
                  id="width-slider"
                  min={20}
                  max={200}
                  step={1}
                  value={[width]}
                  onValueChange={(value) => handleWidthChange(value[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height-slider">Height: {height} characters</Label>
                <Slider
                  id="height-slider"
                  min={10}
                  max={200}
                  step={1}
                  value={[height]}
                  onValueChange={(value) => handleHeightChange(value[0])}
                />
              </div>
            </div>
            <Button onClick={handleConvertAgain} className="w-full">Convert Again</Button>
          </div>
        </CardContent>
      </Card>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Colored ASCII Art</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              dangerouslySetInnerHTML={{ __html: coloredAsciiArt }}
              className="font-mono whitespace-pre overflow-x-auto bg-black p-4 text-[0.5rem] leading-[0.6rem] rounded-md"
              style={{ letterSpacing: '-1px' }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plain ASCII Art</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={asciiArt} 
              readOnly 
              rows={20}
              className="font-mono text-xs mb-2 whitespace-pre overflow-x-auto"
            />
            <Button 
              onClick={() => navigator.clipboard.writeText(asciiArt)}
              className="w-full"
            >
              Copy Plain ASCII
            </Button>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>ASCII Art with Color Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={colorCodedAsciiArt} 
              readOnly 
              rows={20}
              className="font-mono text-xs mb-2 whitespace-pre overflow-x-auto"
            />
            <Button 
              onClick={() => navigator.clipboard.writeText(colorCodedAsciiArt)}
              className="w-full"
            >
              Copy Color-Coded ASCII
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ImprovedAsciiArtConverter