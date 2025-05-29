
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
import { UploadCloud, Sparkles, Copy, Loader2, Image as ImageIcon, Languages } from "lucide-react";

const formSchema = z.object({
  imageSource: z.enum(["upload", "url"]),
  file: z.custom<File>((val) => val instanceof File, "Please upload an image file.").optional(),
  imageUrl: z.string().url("Please enter a valid URL.").optional(),
  tone: z.string().optional(),
  style: z.string().optional(),
  language: z.string().optional(),
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
  { value: "Whimsical", label: "Whimsical" },
  { value: "Dramatic", label: "Dramatic" },
];

const poemStyles = [
  { value: "default", label: "Default Style" },
  { value: "Free Verse", label: "Free Verse" },
  { value: "Haiku", label: "Haiku" },
  { value: "Limerick", label: "Limerick" },
  { value: "Sonnet", label: "Sonnet" },
  { value: "Rhyming Couplets", label: "Rhyming Couplets" },
  { value: "Narrative", label: "Narrative" },
  { value: "Ballad", label: "Ballad" },
  { value: "Ode", label: "Ode" },
];

const poemLanguages = [
  { value: "default", label: "Default Language (English)" },
  { value: "English", label: "English" },
  { value: "Spanish", label: "Español (Spanish)" },
  { value: "French", label: "Français (French)" },
  { value: "German", label: "Deutsch (German)" },
  { value: "Japanese", label: "日本語 (Japanese)" },
  { value: "Hindi", label: "हिन्दी (Hindi)" },
  { value: "Chinese", label: "中文 (简体) (Chinese, Simplified)" },
  { value: "Portuguese", label: "Português (Portuguese)" },
  { value: "Russian", label: "Русский (Russian)" },
  { value: "Italian", label: "Italiano (Italian)" },
  { value: "Bangla", label: "বাংলা (Bangla)" },
];


export default function PhotoPoemForm() {
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
      tone: "default", 
      style: "default",
      language: "default",
    },
  });

  useEffect(() => {
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
        setPoem(null); 
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
        language: (values.language === "" || values.language === "default") ? undefined : values.language,
      };
      const result = await generatePoemFromImage(input);
      setPoem(result.poem);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to generate poem: ${errorMessage}`);
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
      <Card className="shadow-xl transition-all duration-500 ease-out data-[loading=true]:opacity-60 data-[loading=true]:pointer-events-none rounded-xl overflow-hidden" data-loading={isLoading}>
        <CardHeader className="text-center bg-muted/50 p-6">
          <div className="flex justify-center items-center mb-3">
             <Sparkles className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-bold">Create Your PhotoPoem</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-1">Upload an image, choose your style, and let AI craft a unique poem.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="upload" className="w-full" onValueChange={(value) => form.setValue("imageSource", value as "upload" | "url")}>
                <TabsList className="grid w-full grid-cols-2 bg-muted rounded-lg p-1">
                  <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md py-2.5">
                    <UploadCloud className="mr-2 h-5 w-5" /> Upload File
                  </TabsTrigger>
                  <TabsTrigger value="url" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md py-2.5">
                    <ImageIcon className="mr-2 h-5 w-5" /> Image URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-6">
                  <FormField
                    control={form.control}
                    name="file"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Upload Image</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file:text-primary file:font-semibold hover:file:bg-primary/10 p-3 border-dashed border-2 hover:border-primary transition-colors" 
                          />
                        </FormControl>
                        {fileName && <FormDescription className="text-sm pt-1">Selected: {fileName}</FormDescription>}
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
                        <FormLabel className="text-base font-semibold">Image URL</FormLabel>
                        <FormControl>
                           <Input 
                            placeholder="https://example.com/image.png" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              handleImageUrlChange(e.target.value);
                            }}
                            className="p-3" 
                          />
                        </FormControl>
                        <FormDescription className="text-sm pt-1">Paste a direct link to an image.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              {imageDataUri && (
                <div className="mt-8 p-4 border-2 border-primary/30 rounded-lg bg-muted/40 animate-in fade-in-0 duration-500 hover:shadow-xl transition-shadow duration-300">
                  <h3 className="text-xl font-semibold mb-3 text-center text-foreground">Selected Image Preview</h3>
                  <div className="flex justify-center">
                    <Image
                      src={imageDataUri}
                      alt="Uploaded preview"
                      width={350} 
                      height={350} 
                      className="rounded-lg object-contain max-h-[350px] shadow-lg border-2 border-background" 
                      data-ai-hint="uploaded image"
                    />
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-base font-semibold flex items-center">
                      <Languages className="mr-2 h-5 w-5 text-primary" /> Poem Language (Optional)
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-3 text-base">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {poemLanguages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value} className="py-2 text-base">{lang.label}</SelectItem> 
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Poem Tone (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="py-3 text-base">
                            <SelectValue placeholder="Select a tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {poemTones.map(tone => (
                            <SelectItem key={tone.value} value={tone.value} className="py-2 text-base">{tone.label}</SelectItem> 
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
                      <FormLabel className="text-base font-semibold">Poem Style (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="py-3 text-base">
                            <SelectValue placeholder="Select a style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {poemStyles.map(style => (
                            <SelectItem key={style.value} value={style.value} className="py-2 text-base">{style.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {error && <p className="text-base font-medium text-destructive text-center p-3 bg-destructive/10 rounded-md shadow-sm">{error}</p>}

              <Button type="submit" disabled={isLoading || !imageDataUri} className="w-full text-xl py-7 mt-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Generating Poem...
                  </>
                ) : (
                  "✨ Generate Poem ✨"
                )}
              </Button>
            </form>
          </Form>

          {poem && (
            <Card className="mt-10 animate-in fade-in-0 duration-700 shadow-lg rounded-lg">
              <CardHeader className="bg-muted/50 p-6">
                <CardTitle className="text-2xl font-bold text-center">Your PhotoPoem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <Textarea
                  value={poem}
                  readOnly
                  rows={Math.max(8, poem.split('\n').length + 2)} 
                  className="text-foreground bg-background p-6 rounded-lg shadow-inner text-base leading-relaxed whitespace-pre-wrap border-2 border-primary/20 focus:border-primary" 
                />
                <Button onClick={copyPoemToClipboard} variant="outline" className="w-full py-3 text-base border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Copy className="mr-2 h-5 w-5" /> Copy Poem
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
