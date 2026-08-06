function ocr_script(imagePath, outputPath)
    % OCR_SCRIPT Extract text from image using MATLAB OCR
    % Usage: ocr_script(imagePath, outputPath)
    %   imagePath: Path to input image file
    %   outputPath: Path to write extracted text output
    
    try
        % Read the image
        img = imread(imagePath);
        
        % Perform OCR using MATLAB's ocr function
        % Requires Computer Vision Toolbox
        results = ocr(img);
        
        % Extract recognized text
        recognizedText = results.Text;
        
        % Write to output file
        fid = fopen(outputPath, 'w');
        if fid == -1
            error('Failed to open output file: %s', outputPath);
        end
        
        % Write the recognized text
        fprintf(fid, '%s', recognizedText);
        fclose(fid);
        
        % Exit with success code
        exit(0);
        
    catch ME
        % Handle errors
        fid = fopen(outputPath, 'w');
        if fid ~= -1
            fprintf(fid, 'ERROR: %s\n%s', ME.identifier, ME.message);
            fclose(fid);
        end
        
        % Exit with error code
        exit(1);
    end
end
