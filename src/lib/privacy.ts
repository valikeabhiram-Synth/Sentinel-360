import { createWorker } from 'tesseract.js';
import { SanitizationRule, SanitizedResult } from '../types';

export const SANITIZATION_RULES: SanitizationRule[] = [
  {
    name: 'Email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    placeholder: '[EMAIL]',
  },
  {
    name: 'Credit Card',
    pattern: /\b(?:\d[ -]*?){12,19}\b/g,
    placeholder: '[CARD]',
  },
  {
    name: 'Safety Net (Card-like)',
    pattern: /(?:\d[ \t\n-]*?){12,20}/g,
    placeholder: '[SENSITIVE]',
  },
  {
    name: 'Phone Number',
    pattern: /\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g,
    placeholder: '[PHONE]',
  },
  {
    name: 'Social Security Number',
    pattern: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g,
    placeholder: '[SSN]',
  },
  {
    name: 'IPv4 Address',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    placeholder: '[IP_ADDRESS]',
  },
  {
    name: 'Password/Secret',
    pattern: /(?:password|passwd|secret|key|token|auth|api_key|api-key)\s*[:=]\s*["']?([a-zA-Z0-9_\-]{8,})["']?/gi,
    placeholder: '[SECRET]',
  },
  {
    name: 'Aadhaar Number',
    pattern: /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,
    placeholder: '[AADHAAR]',
  },
  {
    name: 'Virtual ID (VID)',
    pattern: /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,
    placeholder: '[VID]',
  },
  {
    name: 'Mobile Number',
    pattern: /\b(?:(?:\+|0{0,2})91[\s-]?)?[6789]\d{9}\b/g,
    placeholder: '[MOBILE]',
  },
  {
    name: 'Registration/Roll Number',
    pattern: /\b(?:Reg(?:istration)?|Roll|Enrollment|Seat|Hall\s*Ticket|Admit\s*Card|Application|Exam|Ticket|Debit\s*Card|Credit\s*Card|Card)\s*(?:No|Number|Code|Id)?\s*(?:is|:|=|\s)+\s*(?!(?:No|Number|Code|Id)\b)([A-Z0-9-]{4,20})\b/gi,
    placeholder: '[REG_NO]',
  },
  {
    name: 'College/Center Code',
    pattern: /\b(?:College|Inst|Center|School|Dept|Venue)\s*(?:Code|Id|No)?\s*(?:is|:|=|\s)+\s*(?!(?:Code|Id|No)\b)([A-Z0-9]{3,10})\b/gi,
    placeholder: '[CODE]',
  },
  {
    name: 'Address',
    pattern: /\b(?:Address|Residing\s*at|Location|Venue)\s*(?:is|:|=|\s)+\s*([\w\s,.-]{10,100})/gi,
    placeholder: '[ADDRESS]',
  },
  {
    name: 'Full Name',
    pattern: /\b(?:Name|Student\s*Name|Candidate\s*Name|User|Cardholder|Name\s*on\s*Card)\s*(?:is|:|=|\s)+\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/gi,
    placeholder: '[NAME]',
  },
  {
    name: 'Generic ID',
    pattern: /\b[A-Z0-9]{2,4}[0-9]{5,12}\b/g,
    placeholder: '[ID]',
  },
  {
    name: 'Card Expiry',
    pattern: /\b(?:Valid\s*Thru|Exp(?:iry)?|Expires|Expiry\s*Date|Valid\s*From|From)\s*(?:is|:|=|\s)*\s*(\d{2}\s*[\/\-]\s*\d{2,4})\b/gi,
    placeholder: '[DATE]',
  },
  {
    name: 'Card Expiry (Standalone)',
    pattern: /\b(0[1-9]|1[0-2])\s*[\/\-]\s*\d{2,4}\b/g,
    placeholder: '[DATE]',
  },
  {
    name: 'CVV/CVC',
    pattern: /\b(?:CVV|CVC|Security\s*Code)\s*(?:is|:|=|\s)*\s*(\d{3,4})\b/gi,
    placeholder: '[CVV]',
  },
  {
    name: 'PAN Card',
    pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g,
    placeholder: '[PAN]',
  },
  {
    name: 'IFSC Code',
    pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
    placeholder: '[IFSC]',
  },
  {
    name: 'Bank Account',
    pattern: /\b(?:\d{9,18})\b/g,
    placeholder: '[ACCOUNT]',
  },
  {
    name: 'Date of Birth',
    pattern: /\b(?:DOB|Date\s*of\s*Birth|Born)\s*(?:is|:|=|\s)*\s*(\d{2}[-/]\d{2}[-/]\d{2,4})\b/gi,
    placeholder: '[DOB]',
  },
  {
    name: 'Card Keyword',
    pattern: /\b(?:BANK|CREDIT|DEBIT|VISA|MASTERCARD|CVV|CVC|EXPIRY|VALID|THRU|CARDHOLDER|AADHAAR|PAN|INCOME TAX|GOVT|INDIA|UNIQUE IDENTIFICATION|AUTHORITY)\b/gi,
    placeholder: '[SENSITIVE]',
  },
];

export function sanitizeText(text: string): SanitizedResult {
  let sanitized = text;
  const matches: { rule: string; value: string; placeholder: string }[] = [];

  for (const rule of SANITIZATION_RULES) {
    // Use a fresh regex to avoid state issues with global flags
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    
    sanitized = sanitized.replace(regex, (match, ...args) => {
      // The last two arguments are the offset and the original string
      // The arguments before that are the capturing groups
      const capturingGroups = args.slice(0, args.length - 2);
      
      let sensitiveValue = match;
      let hasGroup = false;
      
      if (capturingGroups.length > 0 && capturingGroups[0] !== undefined) {
        sensitiveValue = capturingGroups[0];
        hasGroup = true;
      }

      let placeholder = rule.placeholder;
      
      // Custom masking for specific rules - now more aggressive with partial masking
      const rulesWithPartialMask = [
        'Aadhaar Number', 'Virtual ID (VID)', 'Credit Card', 'Mobile Number', 'Registration/Roll Number', 
        'Bank Account', 'PAN Card', 'Social Security Number', 'Phone Number', 
        'Generic ID', 'IFSC Code', 'CVV/CVC', 'Safety Net (Card-like)'
      ];
      
      if (rulesWithPartialMask.includes(rule.name)) {
        // Extract digits or alphanumeric characters for IDs
        const cleanValue = sensitiveValue.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanValue.length >= 4) {
          const lastFour = cleanValue.slice(-4);
          placeholder = `xxxxxx${lastFour}`;
        } else if (cleanValue.length > 0) {
          placeholder = `xxxxxx${cleanValue}`;
        }
      }
      
      matches.push({ rule: rule.name, value: sensitiveValue, placeholder });
      
      if (hasGroup) {
        // If we have a group, we want to replace ONLY the sensitive part within the match
        // to preserve the surrounding context (like "Hall ticket number is ")
        return match.replace(sensitiveValue, placeholder);
      } else {
        return placeholder;
      }
    });
  }

  return { text: sanitized, matches };
}

/**
 * Strips metadata and redacts sensitive text from an image.
 */
export async function stripImageMetadata(file: File): Promise<File> {
  return new Promise(async (resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw original image
      ctx.drawImage(img, 0, 0);

      let redactionApplied = false;

      try {
        console.log('Sentinels 360: Starting OCR redaction...');
        // Perform OCR to find sensitive data
        const worker = await createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`Sentinels 360 OCR: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        // Use the canvas itself for OCR
        const result = await worker.recognize(canvas);
        const lines = (result as any).data.lines;
        
        console.log(`Sentinels 360: OCR found ${lines.length} lines of text.`);

        // Check each line against our rules
        for (const line of lines) {
          const cleanLineText = line.text.trim();
          if (!cleanLineText) continue;

          let lineMatched = false;
          const digitLike = '[0-9BBOOIilL]';
          
          // 1. Check for Sensitive Keywords - if found, redact the WHOLE line
          const sensitiveKeywords = [
            'BANK', 'CREDIT', 'DEBIT', 'VISA', 'MASTERCARD', 'CVV', 'CVC', 
            'EXPIRY', 'VALID', 'THRU', 'CARDHOLDER', 'AADHAAR', 'VID', 'VIRTUAL ID', 'PAN', 
            'INCOME TAX', 'GOVT', 'INDIA', 'UNIQUE IDENTIFICATION', 'AUTHORITY',
            'MALE', 'FEMALE', 'GENDER', 'DOB', 'BIRTH'
          ];
          
          if (sensitiveKeywords.some(kw => cleanLineText.toUpperCase().includes(kw))) {
            console.log(`Sentinels 360: Redacting line due to SENSITIVE KEYWORD match: "${cleanLineText}"`);
            ctx.fillStyle = 'black';
            ctx.fillRect(
              line.bbox.x0 - 35, 
              line.bbox.y0 - 35, 
              (line.bbox.x1 - line.bbox.x0) + 70, 
              (line.bbox.y1 - line.bbox.y0) + 70
            );
            lineMatched = true;
            redactionApplied = true;
          }
          
          // 2. CRITICAL: Extremely aggressive brute force for digits in images
          if (!lineMatched) {
            // Match any sequence of 4+ digits/digit-likes in a line
            const bruteForceRegex = new RegExp(`(?:${digitLike}[ \\t\\n-]*?){4,20}`, 'g');
            
            if (bruteForceRegex.test(cleanLineText)) {
              console.log(`Sentinels 360: Redacting line due to BRUTE FORCE digit-like match: "${cleanLineText}"`);
              ctx.fillStyle = 'black';
              ctx.fillRect(
                line.bbox.x0 - 40, 
                line.bbox.y0 - 40, 
                (line.bbox.x1 - line.bbox.x0) + 80, 
                (line.bbox.y1 - line.bbox.y0) + 80
              );
              lineMatched = true;
              redactionApplied = true;
            }
          }

          if (!lineMatched) {
            for (const rule of SANITIZATION_RULES) {
              // Remove \b for image OCR as Tesseract noise often breaks word boundaries
              const patternSource = rule.pattern.source.replace(/\\b/g, '');
              const regex = new RegExp(patternSource, 'gi');
              const matches = cleanLineText.match(regex);
              
              if (matches && matches.length > 0) {
                console.log(`Sentinels 360: Redacting line due to ${rule.name} match: "${cleanLineText}"`);
                ctx.fillStyle = 'black';
                ctx.fillRect(
                  line.bbox.x0 - 10, 
                  line.bbox.y0 - 10, 
                  (line.bbox.x1 - line.bbox.x0) + 20, 
                  (line.bbox.y1 - line.bbox.y0) + 20
                );
                lineMatched = true;
                redactionApplied = true;
                break;
              }
            }
          }
          
          // Check individual words if line didn't match
          if (!lineMatched && line.words) {
            for (const word of line.words) {
              const cleanWordText = word.text.trim();
              if (!cleanWordText) continue;

              // Brute force word check for digits (CVV, partial numbers)
              const wordBruteForceRegex = new RegExp(`(?:${digitLike}[ \\t\\n-]*?){3,20}`, 'g');
              if (wordBruteForceRegex.test(cleanWordText)) {
                console.log(`Sentinels 360: Redacting word due to BRUTE FORCE digit-like match: "${cleanWordText}"`);
                ctx.fillStyle = 'black';
                ctx.fillRect(
                  word.bbox.x0 - 10, 
                  word.bbox.y0 - 10, 
                  (word.bbox.x1 - word.bbox.x0) + 20, 
                  (word.bbox.y1 - word.bbox.y0) + 20
                );
                redactionApplied = true;
                continue;
              }

              for (const rule of SANITIZATION_RULES) {
                const patternSource = rule.pattern.source.replace(/\\b/g, '');
                const regex = new RegExp(patternSource, 'gi');
                const wordMatches = cleanWordText.match(regex);
                
                if (wordMatches && wordMatches.length > 0) {
                  console.log(`Sentinels 360: Redacting word due to ${rule.name} match: "${cleanWordText}"`);
                  ctx.fillStyle = 'black';
                  ctx.fillRect(
                    word.bbox.x0 - 10, 
                    word.bbox.y0 - 10, 
                    (word.bbox.x1 - word.bbox.x0) + 20, 
                    (word.bbox.y1 - word.bbox.y0) + 20
                  );
                  redactionApplied = true;
                  break;
                }
              }
            }
          }
        }
        await worker.terminate();
        console.log('Sentinels 360: OCR redaction complete. Applied:', redactionApplied);
      } catch (ocrError) {
        console.error('OCR Redaction failed:', ocrError);
        // If OCR fails on a potential card image, we should be safe
        if (file.name.toLowerCase().includes('card') || file.name.toLowerCase().includes('id')) {
          console.warn('Sentinels 360: OCR failed on sensitive-looking file. Applying safety blur.');
          ctx.filter = 'blur(30px)';
          ctx.drawImage(img, 0, 0);
          ctx.filter = 'none';
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'white';
          ctx.font = '24px sans-serif';
          ctx.fillText('REDACTED FOR PRIVACY', 20, 50);
        }
      }

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, { type: file.type || 'image/jpeg' }));
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      }, file.type || 'image/jpeg', 0.9);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Strips metadata from a generic file by re-creating it from its raw data.
 * For images, it uses the canvas method. For others, it creates a new Blob.
 * If the file is text-based, it also sanitizes the content.
 */
export async function stripFileMetadata(file: File): Promise<File> {
  if (file.type.startsWith('image/')) {
    return stripImageMetadata(file);
  }
  
  // Handle text-based files by sanitizing their content
  const textTypes = ['text/plain', 'text/csv', 'application/json', 'text/markdown'];
  const isText = textTypes.includes(file.type) || 
                 file.name.endsWith('.txt') || 
                 file.name.endsWith('.csv') || 
                 file.name.endsWith('.json') || 
                 file.name.endsWith('.md');

  if (isText) {
    const content = await file.text();
    const sanitized = sanitizeText(content);
    return new File([sanitized.text], file.name, { type: file.type || 'text/plain' });
  }
  
  // For other documents, we create a new File object from the arrayBuffer.
  const buffer = await file.arrayBuffer();
  return new File([buffer], file.name, { type: file.type });
}
