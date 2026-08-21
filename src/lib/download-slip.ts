/**
 * Universal Safari & Mobile-Proof PDF / Slip Download Helper
 * Converts base64 data URIs, raw base64, or remote URLs to a proper Blob object URL
 * to avoid WebKit download blocks on iOS and Safari.
 */
export async function downloadPdfSlip(pdfData: string, filename: string): Promise<boolean> {
  if (!pdfData) return false;

  try {
    let blob: Blob;

    if (pdfData.startsWith("data:")) {
      const parts = pdfData.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "application/pdf";
      const base64Content = parts[1] || "";
      
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: mimeType });
    } else if (pdfData.startsWith("http://") || pdfData.startsWith("https://")) {
      const response = await fetch(pdfData);
      if (!response.ok) throw new Error("Failed to fetch remote file");
      blob = await response.blob();
    } else {
      // Raw base64 string
      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: "application/pdf" });
    }

    const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = cleanFilename;
    link.target = "_blank"; // Safari compatibility
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 500);

    return true;
  } catch (error) {
    console.error("Universal PDF download failed, falling back to window.open:", error);
    const fallbackUrl = pdfData.startsWith("data:") 
      ? pdfData 
      : pdfData.startsWith("http") 
      ? pdfData 
      : `data:application/pdf;base64,${pdfData}`;
    window.open(fallbackUrl, "_blank");
    return true;
  }
}
