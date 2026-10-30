import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { MIcon } from './MIcon';
import { AccessibleText } from './AccessibleText';
import { BigButton } from './BigButton';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const { activeLanguage } = useLanguage();
  const { colors } = useTheme();
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [hasCamera, setHasCamera] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isVi = activeLanguage === 'vi';

  const stopCamera = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setErrorMsg('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setErrorMsg(isVi ? 'Trình duyệt không hỗ trợ camera trực tiếp' : 'Camera not supported in browser');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();

        scanTimerRef.current = window.setInterval(tickScan, 250);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setHasCamera(false);
      setErrorMsg(
        isVi
          ? 'Không thể truy cập camera. Bạn có thể tải lên ảnh chụp mã QR bên dưới.'
          : 'Cannot access camera. You can upload a QR image below.'
      );
    }
  };

  const tickScan = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        stopCamera();
        onScanSuccess(code.data);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        stopCamera();
        onScanSuccess(code.data);
      } else {
        setErrorMsg(
          isVi
            ? 'Không nhận diện được mã QR từ hình ảnh này'
            : 'Could not detect a QR code from this image'
        );
      }
    };
    img.src = URL.createObjectURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: 32,
          padding: 24,
          maxWidth: 480,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <AccessibleText variant="h2" weight="900" color={colors.textDark}>
            {isVi ? 'Quét Mã QR Gia Đình' : 'Scan Family QR Code'}
          </AccessibleText>
          <button
            onClick={onClose}
            type="button"
            style={{
              border: 'none',
              backgroundColor: colors.surfaceContainerHighest,
              width: 36,
              height: 36,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MIcon name="close" size={20} color={colors.textDark} />
          </button>
        </div>

        {/* Video stream container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 360,
            height: 270,
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Scanner Overlay Box */}
          <div
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              border: '3px solid #FFDBCF',
              borderRadius: 20,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {errorMsg ? (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 14,
              backgroundColor: colors.errorBg,
              color: colors.error,
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {errorMsg}
          </div>
        ) : null}

        {/* Upload QR image option */}
        <div style={{ width: '100%', display: 'flex', gap: 10 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <BigButton
            variant="tonal"
            iconName="photo_camera"
            onClick={() => fileInputRef.current?.click()}
          >
            {isVi ? 'Tải ảnh QR từ máy' : 'Upload QR Image'}
          </BigButton>
        </div>
      </div>
    </div>
  );
};
