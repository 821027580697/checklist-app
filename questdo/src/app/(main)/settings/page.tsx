// 설정 페이지
'use client';

import { useState } from 'react';
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

  // 프로필 저장
  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await updateDocument('users', user.uid, { nickname, bio });
      if (error) throw error;
      toast.success(lang === 'ko' ? '프로필이 저장되었습니다' : 'Profile saved');
    } catch {
      toast.error(lang === 'ko' ? '저장에 실패했습니다' : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await signOut();
    useAuthStore.getState().logout();
    router.push('/login');
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
