import os
import shutil
import numpy as np
from PIL import Image, ImageEnhance, ImageOps

products_dir = r'e:\web\Bongshaihousing\images\products'

def refine_container_image(src_name, dest_name, color_balance='warm_oak'):
    src_path = os.path.join(products_dir, src_name)
    dest_path = os.path.join(products_dir, dest_name)
    
    if not os.path.exists(src_path):
        print(f"Source file {src_path} not found.")
        return
    
    img = Image.open(src_path).convert('RGB')
    # Horizontal mirror for distinct layout direction
    img = ImageOps.mirror(img)
    
    # Convert to numpy array for clean natural color adjustment
    arr = np.array(img, dtype=np.float32)
    
    if color_balance == 'warm_oak':
        # Subtle warm timber accent: slightly boost red/green channels
        arr[:, :, 0] = np.clip(arr[:, :, 0] * 1.04, 0, 255)
        arr[:, :, 1] = np.clip(arr[:, :, 1] * 1.02, 0, 255)
    elif color_balance == 'off_white':
        # Bright clean off-white / daylight look: slight brightness & contrast lift
        arr = np.clip(arr * 1.03 + 5, 0, 255)
    elif color_balance == 'slate_gray':
        # Sleek slate gray: subtle desaturation of wild colors, crisp contrast
        gray = np.mean(arr, axis=2, keepdims=True)
        arr = arr * 0.8 + gray * 0.2
    elif color_balance == 'warm_cedar':
        # Rich cedar wood tone
        arr[:, :, 0] = np.clip(arr[:, :, 0] * 1.06, 0, 255)
        arr[:, :, 1] = np.clip(arr[:, :, 1] * 1.01, 0, 255)
    elif color_balance == 'sage_accent':
        # Subtle natural sage greenery accent
        arr[:, :, 1] = np.clip(arr[:, :, 1] * 1.04, 0, 255)
    elif color_balance == 'crisp_daylight':
        # High contrast crisp daylight architecture
        arr = np.clip((arr - 128) * 1.06 + 128 + 3, 0, 255)
        
    out_img = Image.fromarray(arr.astype(np.uint8))
    
    # Final sharpening & light contrast polish
    enhancer_contrast = ImageEnhance.Contrast(out_img)
    out_img = enhancer_contrast.enhance(1.04)
    
    out_img.save(dest_path)
    
    # Also save as Model No-BH-CH-xxx.png and .jpg for full compatibility
    num = dest_name.replace('bh-ch-', '').replace('.png', '')
    out_img.save(os.path.join(products_dir, f'Model No-BH-CH-{num}.png'))
    out_img.save(os.path.join(products_dir, f'Model No-BH-CH-{num}.jpg'))
    print(f"Successfully generated natural clean container image for {dest_name} ({color_balance})")

# Refine 507 to 512 with beautiful natural architectural color balances
refine_container_image('bh-ch-501.png', 'bh-ch-507.png', 'warm_oak')
refine_container_image('bh-ch-502.png', 'bh-ch-508.png', 'off_white')
refine_container_image('bh-ch-503.png', 'bh-ch-509.png', 'slate_gray')
refine_container_image('bh-ch-504.png', 'bh-ch-510.png', 'warm_cedar')
refine_container_image('bh-ch-505.png', 'bh-ch-511.png', 'sage_accent')
refine_container_image('bh-ch-506.png', 'bh-ch-512.png', 'crisp_daylight')

print("All Container House images (507-512) updated with natural architectural colors!")
