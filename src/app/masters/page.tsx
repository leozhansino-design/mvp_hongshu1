'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConsultationModal from '@/components/ConsultationModal';
import { Master, formatPrice, formatFollowUps } from '@/types/master';

export default function MastersPage() {
  const { isLoggedIn, setShowLoginModal, setLoginRedirectMessage } = useAuth();
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  useEffect(() => {
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const response = await fetch('/api/masters');
      const data = await response.json();
      if (data.success) {
        setMasters(data.masters);
      }
    } catch (error) {
      console.error('Failed to fetch masters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsult = (master: Master) => {
    if (!isLoggedIn) {
      setLoginRedirectMessage('请先登录后再咨询大师');
      setShowLoginModal(true);
      return;
    }
    setSelectedMaster(master);
    setShowConsultationModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif mb-4">大师测算</h1>
          <p className="text-text-secondary">
            真人解读 · 一对一服务 · 不满意全额退款
          </p>
        </div>

        {/* Masters List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {masters.map((master) => (
              <MasterCard
                key={master.id}
                master={master}
                onConsult={() => handleConsult(master)}
              />
            ))}
          </div>
        )}

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-text-secondary text-sm">
            支付后24小时内，大师将通过微信为您详细解读
          </p>
          <p className="text-text-secondary text-sm mt-1">
            如有疑问请联系客服
          </p>
        </div>
      </main>

      {/* Consultation Modal */}
      {selectedMaster && (
        <ConsultationModal
          isOpen={showConsultationModal}
          onClose={() => {
            setShowConsultationModal(false);
            setSelectedMaster(null);
          }}
          master={selectedMaster}
        />
      )}

      <Footer />
    </div>
  );
}

// Master Card Component
function MasterCard({
  master,
  onConsult,
}: {
  master: Master;
  onConsult: () => void;
}) {
  const getTagStyle = (tag: string) => {
    switch (tag) {
      case '新人推荐':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case '好评最多':
        return 'bg-gold-400/20 text-gold-400 border-gold-400/30';
      case '限时优惠':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6 border border-gray-800 hover:border-gray-700 transition-all hover:bg-gray-900/70">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {(master as Master & { avatar?: string }).avatar ? (
            <img
              src={(master as Master & { avatar?: string }).avatar}
              alt={master.name}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gold-400/30 to-purple-500/30 flex items-center justify-center text-xl sm:text-2xl font-serif text-gold-400">
              {master.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-medium text-white">{master.name}</h3>
            <span className="text-lg sm:text-xl font-medium text-gold-400">
              ¥{formatPrice(master.price)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-text-secondary mb-2 sm:mb-3">
            {master.years && <span>从业{master.years}年</span>}
            <span>·</span>
            <span>{master.wordCount}字解读</span>
            <span>·</span>
            <span>可追问{formatFollowUps(master.followUps)}</span>
          </div>

          {/* Tags */}
          {master.tags && master.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              {master.tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded border ${getTagStyle(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Intro */}
          {master.intro && (
            <p className="text-text-secondary text-xs sm:text-sm italic line-clamp-2">
              「{master.intro}」
            </p>
          )}
        </div>

        {/* Consult Button - Desktop only */}
        <div className="hidden sm:block flex-shrink-0">
          <button
            onClick={onConsult}
            className="px-6 py-2.5 bg-gradient-to-r from-gold-400/90 to-amber-500/90 text-black font-medium rounded-lg hover:from-gold-400 hover:to-amber-500 transition-all"
          >
            立即咨询
          </button>
        </div>
      </div>

      {/* Consult Button - Mobile only */}
      <button
        onClick={onConsult}
        className="sm:hidden w-full mt-3 py-2.5 bg-gradient-to-r from-gold-400/90 to-amber-500/90 text-black font-medium rounded-lg hover:from-gold-400 hover:to-amber-500 transition-all"
      >
        立即咨询
      </button>
    </div>
  );
}
