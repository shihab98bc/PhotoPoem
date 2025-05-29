
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, ChangeEvent, useEffect } from "react";
import Image from "next/image";
import { generatePoemFromImage } from "@/ai/flows/generate-poem-from-image";
import type { GeneratePoemFromImageInput } from "@/ai/flows/generate-poem-from-image";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Settings2, Copy, Loader2, Image as ImageIcon } from "lucide-react";

const formSchema = z.object({
  imageSource: z.enum(["upload", "url"]),
  file: z.custom<File>((val) => val instanceof File, "Please upload an image file.").optional(),
  imageUrl: z.string().url("Please enter a valid URL.").optional(),
  tone: z.string().optional(),
  style: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.imageSource === "upload" && !data.file) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["file"],
      message: "Please upload an image if 'Upload File' is selected.",
    });
  }
  if (data.imageSource === "url" && !data.imageUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["imageUrl"],
      message: "Please enter an image URL if 'Image URL' is selected.",
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

const poemTones = [
  { value: "default", label: "Default Tone" },
  { value: "Joyful", label: "Joyful" },
  { value: "Reflective", label: "Reflective" },
  { value: "Humorous", label: "Humorous" },
  { value: "Romantic", label: "Romantic" },
  { value: "Melancholic", label: "Melancholic" },
  { value: "Mysterious", label: "Mysterious" },
];

const poemStyles = [
  { value: "default", label: "Default Style" },
  { value: "Free Verse", label: "Free Verse" },
  { value: "Haiku", label: "Haiku" },
  { value: "Limerick", label: "Limerick" },
  { value: "Sonnet", label: "Sonnet" },
  { value: "Rhyming Couplets", label: "Rhyming Couplets" },
  { value: "Narrative", label: "Narrative" },
];

export default function PhotoPoetForm() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [poem, setPoem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageSource: "upload",
      tone: "", // Empty string will show placeholder, as no SelectItem has value ""
      style: "", // Empty string will show placeholder
    },
  });

  useEffect(() => {
    // Reset image and poem if image source changes
    setImageDataUri(null);
    setPoem(null);
    setFileName(null);
    form.resetField("file");
    form.resetField("imageUrl");
  }, [form.watch("imageSource"), form]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("file", file);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUri(reader.result as string);
        setPoem(null); // Clear previous poem
        setError(null);
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        toast({ variant: "destructive", title: "Error", description: "Failed to read file." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = async (url: string) => {
    if (!url) {
      setImageDataUri(null);
      setFileName(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setPoem(null);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText} (Status: ${response.status})`);
      }
      const blob = await response.blob();
       if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to a valid image. Please ensure the URL is a direct link to an image file (e.g., .jpg, .png).');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUri(reader.result as string);
        setFileName(url.substring(url.lastIndexOf('/') + 1) || "Image from URL");
        setIsLoading(false);
      };
      reader.onerror = () => {
        throw new Error("Failed to process image from URL.");
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching the image URL.";
      setError(`Error fetching image from URL. ${errorMessage} This could be due to CORS policy or an invalid URL. Try uploading the image directly.`);
      toast({ variant: "destructive", title: "Error", description: `Failed to load image from URL. ${errorMessage}` });
      setImageDataUri(null);
      setFileName(null);
      setIsLoading(false);
 console.error("Error fetching image from URL:", err);
    }
  };
  
  async function onSubmit(values: FormValues) {
    if (!imageDataUri) {
      setError("Please select an image first.");
      toast({ variant: "destructive", title: "Error", description: "No image selected." });
      return;
    }
    setError(null);
    setIsLoading(true);
    setPoem(null);

    try {
      const input: GeneratePoemFromImageInput = {
        photoDataUri: imageDataUri,
        tone: (values.tone === "" || values.tone === "default") ? undefined : values.tone,
        style: (values.style === "" || values.style === "default") ? undefined : values.style,
      };
      const result = await generatePoemFromImage(input);
      setPoem(result.poem);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to generate poem: ${errorMessage}`);
 console.error("Error generating poem:", err); // Log the error object
      toast({ variant: "destructive", title: "AI Error", description: `Failed to generate poem: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  }

  const copyPoemToClipboard = () => {
    if (poem) {
      navigator.clipboard.writeText(poem)
        .then(() => {
          toast({ title: "Success", description: "Poem copied to clipboard!" });
        })
        .catch(() => {
          toast({ variant: "destructive", title: "Error", description: "Failed to copy poem." });
        });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg transition-all duration-500 ease-out data-[loading=true]:opacity-50" data-loading={isLoading}>
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-2">
             <Settings2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-semibold">Create Your PhotoPoem</CardTitle>
          <CardDescription>Upload an image or provide a URL, choose your style, and let AI craft a unique poem for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="upload" className="w-full" onValueChange={(value) => form.setValue("imageSource", value as "upload" | "url")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload File
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <ImageIcon className="mr-2 h-4 w-4" /> Image URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-6">
                  <FormField
                    control={form.control}
                    name="file"
                    render={() => (
                      <FormItem>
                        <FormLabel>Upload Image</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file:text-primary file:font-semibold hover:file:bg-primary/10"
                          />
                        </FormControl>
                        {fileName && <FormDescription>Selected: {fileName}</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="url" className="mt-6">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                           <Input 
                            placeholder="https://example.com/image.png" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              handleImageUrlChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>Paste a direct link to an image.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              {imageDataUri && (
                <div className="mt-6 p-4 border rounded-md bg-muted/30 animate-in fade-in-0 duration-500">
                  <h3 className="text-lg font-medium mb-2 text-center">Selected Image Preview</h3>
                  <div className="flex justify-center">
                    <Image
                      src={imageDataUri}
                      alt="Uploaded preview"
                      width={300}
                      height={300}
                      className="rounded-md object-contain max-h-[300px] shadow-md"
                      data-ai-hint="uploaded image"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poem Tone (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {poemTones.map(tone => (
                            <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poem Style (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {poemStyles.map(style => (
                            <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
 {error && <p className="text-sm font-medium text-destructive text-center p-2 bg-destructive/10 rounded-md break-words">{error}</p>}

              <Button type="submit" disabled={isLoading || !imageDataUri} className="w-full text-lg py-6 mt-8">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Poem...
                  </>
                ) : (
                  "✨ Generate Poem ✨"
                )}
              </Button>
            </form>
          </Form>

          {poem && (
            <Card className="mt-10 animate-in fade-in-0 duration-700">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-center">Your PhotoPoem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={poem}
                  readOnly
                  rows={Math.max(5, poem.split('\n').length + 2)}
                  className="text-foreground bg-muted/20 p-4 rounded-md shadow-inner text-sm leading-relaxed whitespace-pre-wrap"
                />
                <Button onClick={copyPoemToClipboard} variant="outline" className="w-full">
                  <Copy className="mr-2 h-4 w-4" /> Copy Poem
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
