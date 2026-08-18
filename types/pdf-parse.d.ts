declare module 'pdf-parse' {
  interface PDFInfo {
    numpages?: number;
    numrender?: number;
    info?: any;
    metadata?: any;
    version?: string;
    text?: string;
  }

  function pdfParse(dataBuffer: Buffer | Uint8Array | ArrayBuffer): Promise<PDFInfo>;

  export default pdfParse;
}
