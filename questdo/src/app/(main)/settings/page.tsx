// 설정 페이지
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useTranslation } from '@/hooks/useTranslation';
import { signOut } from '@/lib/firebase/auth';
import { updateDocument } from '@/lib/firebase/firestore';
import { uploadAvatar } from '@/lib/firebase/storage';
import { toast } from 'sonner';
import {
  User,
  Bell,
  Palette,
  Languages,
  Shield,
  Download,
  LogOut,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Camera,
  Loader2,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme, setLanguage } = useUIStore();
  const lang = language as 'ko' | 'en';

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setUser = useAuthStore((state) => state.setUser);

  // 프로필 저장
  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await updateDocument('users', user.uid, { nickname, bio });
      if (error) throw error;
      // Zustand 스토어도 동기화
      setUser({ ...user, nickname, bio });
      toast.success(lang === 'ko' ? '프로필이 저장되었습니다' : 'Profile saved');
    } catch {
      toast.error(lang === 'ko' ? '저장에 실패했습니다' : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // 프로필 사진 업로드
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(lang === 'ko' ? 'JPG, PNG, WebP, GIF 형식만 가능합니다' : 'Only JPG, PNG, WebP, GIF allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === 'ko' ? '5MB 이하 파일만 가능합니다' : 'Max 5MB');
      return;
    }
    setIsUploading(true);
    try {
      const { url, error } = await uploadAvatar(user.uid, file);
      if (error) throw error;
      if (!url) throw new Error('Upload failed');
      const { error: updateError } = await updateDocument('users', user.uid, { avatarUrl: url });
      if (updateError) throw updateError;
      setUser({ ...user, avatarUrl: url });
      toast.success(lang === 'ko' ? '프로필 사진이 변경되었습니다' : 'Profile photo updated');
    } catch {
      toast.error(lang === 'ko' ? '사진 업로드에 실패했습니다' : 'Failed to upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await signOut();
    useAuthStore.getState().logout();
    router.replace('/login');
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </motion.div>

      {/* 프로필 편집 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('settings.profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 프로필 사진 */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-2xl cursor-pointer overflow-hidden ring-2 ring-background shadow-md transition-transform group-hover:scale-105"
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (user?.avatarUrl?.startsWith('http') || user?.avatarUrl?.startsWith('data:')) ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{user?.nickname?.charAt(0) || '?'}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="text-[14px] font-semibold">{user?.nickname}</p>
              <p className="text-[12px] text-muted-foreground">
                {lang === 'ko' ? '사진을 탭하여 변경' : 'Tap to change photo'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('onboarding.nicknameLabel')}</Label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="rounded-xl"
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label>{lang === 'ko' ? '자기소개' : 'Bio'}</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-xl resize-none"
              maxLength={150}
              rows={3}
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            className="rounded-xl"
            disabled={isSaving}
          >
            {isSaving ? (lang === 'ko' ? '저장 중...' : 'Saving...') : t('common.save')}
          </Button>
        </CardContent>
      </Card>

      {/* 테마 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('settings.theme')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'light' as const, label: t('settings.themeLight'), icon: Sun },
              { value: 'dark' as const, label: t('settings.themeDark'), icon: Moon },
              { value: 'system' as const, label: t('settings.themeSystem'), icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={theme === value ? 'default' : 'outline'}
                className="rounded-xl h-auto py-3 flex-col gap-1"
                onClick={() => setTheme(value)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 언어 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={language}
            onValueChange={(value) => setLanguage(value as 'ko' | 'en')}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ko">🇰🇷 한국어</SelectItem>
              <SelectItem value="en">🇺🇸 English</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('settings.notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'taskReminder', label: lang === 'ko' ? '할 일 리마인더' : 'Task Reminders' },
            { key: 'habitReminder', label: lang === 'ko' ? '습관 리마인더' : 'Habit Reminders' },
            { key: 'socialActivity', label: lang === 'ko' ? '소셜 알림' : 'Social Activity' },
            { key: 'achievements', label: lang === 'ko' ? '도전과제 알림' : 'Achievement Alerts' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm">{item.label}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 프라이버시 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('settings.privacy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('settings.profilePublic')}</span>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('settings.showStreak')}</span>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('settings.showLevel')}</span>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* 데이터 & 계정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.account')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full rounded-xl justify-start">
            <Download className="mr-2 h-4 w-4" />
            {t('settings.dataExport')}
          </Button>
          <Separator />
          <Button
            variant="outline"
            className="w-full rounded-xl justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('auth.logout')}
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl justify-start text-red-500 hover:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('settings.deleteAccount')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
