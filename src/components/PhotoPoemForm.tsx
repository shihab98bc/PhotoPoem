
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
import { UploadCloud, Sparkles, Copy, Loader2, Image as ImageIcon, Languages, ListTree } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";


const formSchema = z.object({
  imageSource: z.enum(["upload", "url"]),
  file: z.custom<File>((val) => val instanceof File, "Please upload an image file.").optional(),
  imageUrl: z.string().url("Please enter a valid URL.").optional(),
  tone: z.string().optional(),
  style: z.string().optional(),
  language: z.string().optional(),
  numberOfLines: z.coerce.number().int().positive("Number of lines must be a positive integer.").optional().or(z.literal('')),
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
  { value: "default", labelKey: "form.select.tone.default", label: "Default Tone" },
  { value: "Joyful", labelKey: "form.select.tone.joyful", label: "Joyful" },
  { value: "Reflective", labelKey: "form.select.tone.reflective", label: "Reflective" },
  { value: "Humorous", labelKey: "form.select.tone.humorous", label: "Humorous" },
  { value: "Romantic", labelKey: "form.select.tone.romantic", label: "Romantic" },
  { value: "Melancholic", labelKey: "form.select.tone.melancholic", label: "Melancholic" },
  { value: "Mysterious", labelKey: "form.select.tone.mysterious", label: "Mysterious" },
  { value: "Whimsical", labelKey: "form.select.tone.whimsical", label: "Whimsical" },
  { value: "Dramatic", labelKey: "form.select.tone.dramatic", label: "Dramatic" },
];

const poemStyles = [
  { value: "default", labelKey: "form.select.style.default", label: "Default Style" },
  { value: "Free Verse", labelKey: "form.select.style.freeVerse", label: "Free Verse" },
  { value: "Haiku", labelKey: "form.select.style.haiku", label: "Haiku" },
  { value: "Limerick", labelKey: "form.select.style.limerick", label: "Limerick" },
  { value: "Sonnet", labelKey: "form.select.style.sonnet", label: "Sonnet" },
  { value: "Rhyming Couplets", labelKey: "form.select.style.rhymingCouplets", label: "Rhyming Couplets" },
  { value: "Narrative", labelKey: "form.select.style.narrative", label: "Narrative" },
  { value: "Ballad", labelKey: "form.select.style.ballad", label: "Ballad" },
  { value: "Ode", labelKey: "form.select.style.ode", label: "Ode" },
];

const poemLanguages = [
  { value: "default", labelKey: "form.select.poemLanguage.default", label: "Default Language (English)" },
  { value: "English", labelKey: "form.select.poemLanguage.english", label: "English" },
  { value: "Spanish", labelKey: "form.select.poemLanguage.spanish", label: "Español (Spanish)" },
  { value: "French", labelKey: "form.select.poemLanguage.french", label: "Français (French)" },
  { value: "German", labelKey: "form.select.poemLanguage.german", label: "Deutsch (German)" },
  { value: "Japanese", labelKey: "form.select.poemLanguage.japanese", label: "日本語 (Japanese)" },
  { value: "Hindi", labelKey: "form.select.poemLanguage.hindi", label: "हिन्दी (Hindi)" },
  { value: "Chinese", labelKey: "form.select.poemLanguage.chinese", label: "中文 (简体) (Chinese, Simplified)" },
  { value: "Portuguese", labelKey: "form.select.poemLanguage.portuguese", label: "Português (Portuguese)" },
  { value: "Russian", labelKey: "form.select.poemLanguage.russian", label: "Русский (Russian)" },
  { value: "Italian", labelKey: "form.select.poemLanguage.italian", label: "Italiano (Italian)" },
  { value: "Bangla", labelKey: "form.select.poemLanguage.bangla", label: "বাংলা (Bangla)" },
];


export default function PhotoPoemForm() {
  const { t } = useLanguage();
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
      numberOfLines: '',
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
        const errorMsg = t("toast.error.fileRead");
        setError(errorMsg);
        toast({ variant: "destructive", title: "Error", description: errorMsg });
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
      const fetchErrorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching the image URL.";
      const fullErrorMessage = t("toast.error.imageFetch.generic") + " " + fetchErrorMessage;
      setError(fullErrorMessage);
      toast({ variant: "destructive", title: "Error", description: t("toast.error.imageFetch", {errorMessage: fetchErrorMessage}) });
      setImageDataUri(null);
      setFileName(null);
      setIsLoading(false);
    }
  };
  
  async function onSubmit(values: FormValues) {
    if (!imageDataUri) {
      const errorMsg = t("toast.error.noImageSelected");
      setError(errorMsg);
      toast({ variant: "destructive", title: "Error", description: errorMsg });
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
        numberOfLines: values.numberOfLines === '' ? undefined : Number(values.numberOfLines),
      };
      const result = await generatePoemFromImage(input);
      setPoem(result.poem);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      const fullError = t("toast.error.aiGeneric", {errorMessage});
      setError(fullError);
      toast({ variant: "destructive", title: "AI Error", description: fullError });
    } finally {
      setIsLoading(false);
    }
  }

  const copyPoemToClipboard = () => {
    if (poem) {
      navigator.clipboard.writeText(poem)
        .then(() => {
          toast({ title: "Success", description: t("toast.success.poemCopied") });
        })
        .catch(() => {
          toast({ variant: "destructive", title: "Error", description: t("toast.error.copyFail") });
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
          <CardTitle className="text-2xl sm:text-3xl font-bold">{t('form.title')}</CardTitle>
          <CardDescription className="text-base sm:text-lg text-muted-foreground mt-1">{t('form.description')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="upload" className="w-full" onValueChange={(value) => form.setValue("imageSource", value as "upload" | "url")}>
                <TabsList className="grid w-full grid-cols-2 bg-muted rounded-lg p-1">
                  <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md py-2.5 text-sm sm:text-base">
                    <UploadCloud className="mr-2 h-5 w-5" /> {t('form.tab.upload')}
                  </TabsTrigger>
                  <TabsTrigger value="url" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md py-2.5 text-sm sm:text-base">
                    <ImageIcon className="mr-2 h-5 w-5" /> {t('form.tab.imageUrl')}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-6">
                  <FormField
                    control={form.control}
                    name="file"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base font-semibold">{t('form.label.uploadImage')}</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file:text-primary file:font-semibold hover:file:bg-primary/10 p-3 border-dashed border-2 hover:border-primary transition-colors" 
                          />
                        </FormControl>
                        {fileName && <FormDescription className="text-sm pt-1">{t('form.description.fileSelected', { fileName })}</FormDescription>}
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
                        <FormLabel className="text-sm sm:text-base font-semibold">{t('form.label.imageUrl')}</FormLabel>
                        <FormControl>
                           <Input 
                            placeholder={t('form.placeholder.imageUrl')}
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              handleImageUrlChange(e.target.value);
                            }}
                            className="p-3" 
                          />
                        </FormControl>
                        <FormDescription className="text-sm pt-1">{t('form.description.imageUrl')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              {imageDataUri && (
                <div className="mt-8 p-4 border-2 border-primary/30 rounded-lg bg-muted/40 animate-in fade-in-0 duration-500 hover:shadow-xl transition-shadow duration-300">
                  <h3 className="text-lg sm:text-xl font-semibold mb-3 text-center text-foreground">{t('form.imagePreview.title')}</h3>
                  <div className="flex justify-center">
                    <div className="w-full max-w-[300px] sm:max-w-[350px] mx-auto">
                      <Image
                        src={imageDataUri}
                        alt="Uploaded preview"
                        width={350} 
                        height={350} 
                        className="rounded-lg object-contain w-full h-auto shadow-lg border-2 border-background" 
                        data-ai-hint="uploaded image"
                      />
                    </div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-sm sm:text-base font-semibold flex items-center">
                      <Languages className="mr-2 h-5 w-5 text-primary" /> {t('form.label.language')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-2.5 text-sm sm:py-3 sm:text-base">
                          <SelectValue placeholder={t('form.select.language.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {poemLanguages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value} className="py-1.5 text-sm sm:py-2 sm:text-base">{t(lang.labelKey, {defaultValue: lang.label})}</SelectItem> 
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
                      <FormLabel className="text-sm sm:text-base font-semibold">{t('form.label.tone')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="py-2.5 text-sm sm:py-3 sm:text-base">
                            <SelectValue placeholder={t('form.select.tone.placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {poemTones.map(tone => (
                            <SelectItem key={tone.value} value={tone.value} className="py-1.5 text-sm sm:py-2 sm:text-base">{t(tone.labelKey, {defaultValue: tone.label})}</SelectItem> 
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
                      <FormLabel className="text-sm sm:text-base font-semibold">{t('form.label.style')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="py-2.5 text-sm sm:py-3 sm:text-base">
                            <SelectValue placeholder={t('form.select.style.placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {poemStyles.map(style => (
                            <SelectItem key={style.value} value={style.value} className="py-1.5 text-sm sm:py-2 sm:text-base">{t(style.labelKey, {defaultValue: style.label})}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="numberOfLines"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-sm sm:text-base font-semibold flex items-center">
                       <ListTree className="mr-2 h-5 w-5 text-primary" /> {t('form.label.numberOfLines')}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={t('form.placeholder.numberOfLines')}
                        {...field} 
                        onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        className="p-3 text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormDescription className="text-sm pt-1">{t('form.description.numberOfLines')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && <p className="text-sm sm:text-base font-medium text-destructive text-center p-3 bg-destructive/10 rounded-md shadow-sm">{error}</p>}

              <Button type="submit" disabled={isLoading || !imageDataUri} className="w-full text-lg py-6 sm:text-xl sm:py-7 mt-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    {t('form.button.generating')}
                  </>
                ) : (
                  t('form.button.generate')
                )}
              </Button>
            </form>
          </Form>

          {poem && (
            <Card className="mt-10 animate-in fade-in-0 duration-700 shadow-lg rounded-lg">
              <CardHeader className="bg-muted/50 p-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-center">{t('form.poemCard.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <Textarea
                  value={poem}
                  readOnly
                  rows={Math.max(8, poem.split('\n').length + 2)} 
                  className="text-foreground bg-background p-4 sm:p-6 rounded-lg shadow-inner text-sm sm:text-base leading-relaxed whitespace-pre-wrap border-2 border-primary/20 focus:border-primary" 
                />
                <Button onClick={copyPoemToClipboard} variant="outline" className="w-full py-3 text-sm sm:text-base border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Copy className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> {t('form.button.copyPoem')}
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
