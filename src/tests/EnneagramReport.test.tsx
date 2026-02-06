/**
 * 九型人格报告组件测试
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnneagramReport from '@/components/EnneagramReport';
import type { EnneagramResult } from '@/lib/enneagram';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <div data-testid="chevron-left">ChevronLeft</div>,
  ChevronRight: () => <div data-testid="chevron-right">ChevronRight</div>,
  Download: () => <div data-testid="download">Download</div>,
  Share2: () => <div data-testid="share">Share</div>,
}));

describe('EnneagramReport', () => {
  const mockResult: EnneagramResult = {
    mainType: 1,
    wingType: 9,
    scores: [16, 12, 10, 8, 11, 9, 13, 7, 15],
    mainTypeName: '完美主义者',
    mainTypeEnglishName: 'The Reformer',
    wingTypeName: '和平主义者',
    wingCombinationName: '理想主义者',
    scorePercentages: [100, 75, 62.5, 50, 68.75, 56.25, 81.25, 43.75, 93.75]
  };

  it('应该渲染报告组件', () => {
    render(<EnneagramReport result={mockResult} />);
    expect(screen.getByText(/九型人格专业报告/)).toBeInTheDocument();
  });

  it('应该显示正确的页数', () => {
    render(<EnneagramReport result={mockResult} />);
    // 应该有12页
    expect(screen.getByText(/12/)).toBeInTheDocument();
  });

  it('应该显示封面页', () => {
    render(<EnneagramReport result={mockResult} />);
    expect(screen.getByText(/完美主义者/)).toBeInTheDocument();
    expect(screen.getByText(/有原则的、理想主义的改革者/)).toBeInTheDocument();
  });

  it('应该支持页面导航', () => {
    render(<EnneagramReport result={mockResult} />);

    // 初始在第一页
    expect(screen.getByText(/第 1 \/ 12 页/)).toBeInTheDocument();

    // 点击下一页
    const nextButton = screen.getByRole('button', { name: /下一页/ });
    fireEvent.click(nextButton);

    // 应该到第二页
    expect(screen.getByText(/第 2 \/ 12 页/)).toBeInTheDocument();
  });

  it('应该在第一页禁用上一页按钮', () => {
    render(<EnneagramReport result={mockResult} />);
    const prevButton = screen.getByRole('button', { name: /上一页/ });
    expect(prevButton).toBeDisabled();
  });

  it('应该显示导出和分享按钮', () => {
    render(<EnneagramReport result={mockResult} />);
    expect(screen.getByRole('button', { name: /导出/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /分享/ })).toBeInTheDocument();
  });

  it('应该支持通过页码指示器快速跳转', () => {
    render(<EnneagramReport result={mockResult} />);

    // 找到所有页码指示器按钮（应该有12个）
    const indicators = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('rounded-full') && !btn.textContent
    );

    expect(indicators.length).toBe(12);
  });

  it('应该渲染所有主要类型的报告', () => {
    for (let type = 1; type <= 9; type++) {
      const result: EnneagramResult = {
        mainType: type,
        wingType: type === 1 ? 9 : type - 1,
        scores: [12, 11, 10, 9, 8, 7, 6, 5, 4],
        mainTypeName: '测试类型',
        mainTypeEnglishName: 'Test Type',
        wingTypeName: '侧翼',
        wingCombinationName: '组合',
        scorePercentages: [100, 91.67, 83.33, 75, 66.67, 58.33, 50, 41.67, 33.33]
      };

      const { unmount } = render(<EnneagramReport result={result} />);

      // 检查类型显示
      expect(screen.getByText(new RegExp(type.toString()))).toBeInTheDocument();

      unmount();
    }
  });

  it('应该显示用户名称（如果提供）', () => {
    render(<EnneagramReport result={mockResult} userName="张三" />);
    expect(screen.getByText(/张三/)).toBeInTheDocument();
  });

  it('应该使用默认用户名（如果未提供）', () => {
    render(<EnneagramReport result={mockResult} />);
    expect(screen.getByText(/用户/)).toBeInTheDocument();
  });

  describe('各页面内容渲染', () => {
    it('第1页：应该显示封面', () => {
      render(<EnneagramReport result={mockResult} />);
      expect(screen.getByText(/九型人格测试报告/)).toBeInTheDocument();
      expect(screen.getByText(/专业版/)).toBeInTheDocument();
    });

    it('第2页：应该显示类型总览', () => {
      render(<EnneagramReport result={mockResult} />);
      const nextButton = screen.getByRole('button', { name: /下一页/ });
      fireEvent.click(nextButton);

      expect(screen.getByText(/人格类型总览/)).toBeInTheDocument();
    });

    it('第3页：应该显示核心特质', () => {
      render(<EnneagramReport result={mockResult} />);
      const nextButton = screen.getByRole('button', { name: /下一页/ });

      // 跳到第3页
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(screen.getByText(/深度解析/)).toBeInTheDocument();
      expect(screen.getByText(/内心世界/)).toBeInTheDocument();
    });

    it('第4页：应该显示雷达图', () => {
      render(<EnneagramReport result={mockResult} />);
      const nextButton = screen.getByRole('button', { name: /下一页/ });

      // 跳到第4页
      for (let i = 0; i < 3; i++) {
        fireEvent.click(nextButton);
      }

      expect(screen.getByText(/九维分析/)).toBeInTheDocument();
    });

    it('第5页：应该显示优势与挑战', () => {
      render(<EnneagramReport result={mockResult} />);
      const nextButton = screen.getByRole('button', { name: /下一页/ });

      // 跳到第5页
      for (let i = 0; i < 4; i++) {
        fireEvent.click(nextButton);
      }

      expect(screen.getByText(/优势与挑战/)).toBeInTheDocument();
    });

    it('第8页：应该显示人际关系', () => {
      render(<EnneagramReport result={mockResult} />);
      const nextButton = screen.getByRole('button', { name: /下一页/ });

      // 跳到第8页
      for (let i = 0; i < 7; i++) {
        fireEvent.click(nextButton);
      }

      expect(screen.getByText(/人际关系/)).toBeInTheDocument();
      expect(screen.getByText(/恋爱关系/)).toBeInTheDocument();
    });

    it('第10页：应该显示职业发展', () => {
      render(<EnneagramReport result={mockResult} />);
      const nextButton = screen.getByRole('button', { name: /下一页/ });

      // 跳到第10页
      for (let i = 0; i < 9; i++) {
        fireEvent.click(nextButton);
      }

      expect(screen.getByText(/职业发展/)).toBeInTheDocument();
    });

    it('第12页：应该显示名人与金句', () => {
      render(<EnneagramReport result={mockResult} />);
      const nextButton = screen.getByRole('button', { name: /下一页/ });

      // 跳到第12页（最后一页）
      for (let i = 0; i < 11; i++) {
        fireEvent.click(nextButton);
      }

      expect(screen.getByText(/名人与金句/)).toBeInTheDocument();
      expect(screen.getByText(/你并不孤单/)).toBeInTheDocument();
    });
  });

  describe('侧翼显示', () => {
    it('应该显示侧翼信息（如果有）', () => {
      render(<EnneagramReport result={mockResult} />);
      const nextButton = screen.getByRole('button', { name: /下一页/ });
      fireEvent.click(nextButton); // 到第2页

      expect(screen.getByText(/您的侧翼/)).toBeInTheDocument();
    });
  });

  describe('响应式设计', () => {
    it('应该在移动端和桌面端都能正常渲染', () => {
      const { container } = render(<EnneagramReport result={mockResult} />);

      // 检查响应式类名
      const mainContent = container.querySelector('.max-w-4xl');
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理无效的类型数据', () => {
      const invalidResult: EnneagramResult = {
        mainType: 10, // 无效类型
        wingType: 1,
        scores: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        mainTypeName: '无效类型',
        mainTypeEnglishName: 'Invalid',
        wingTypeName: '侧翼',
        wingCombinationName: '组合',
        scorePercentages: [11.11, 22.22, 33.33, 44.44, 55.56, 66.67, 77.78, 88.89, 100]
      };

      render(<EnneagramReport result={invalidResult} />);
      expect(screen.getByText(/报告数据加载失败/)).toBeInTheDocument();
    });

    it('应该处理缺失的分数数据', () => {
      const resultWithoutScores: EnneagramResult = {
        mainType: 1,
        wingType: 9,
        scores: [],
        mainTypeName: '完美主义者',
        mainTypeEnglishName: 'The Reformer',
        wingTypeName: '和平主义者',
        wingCombinationName: '理想主义者',
        scorePercentages: []
      };

      render(<EnneagramReport result={resultWithoutScores} />);
      // 应该仍然渲染，但可能显示空数据
      expect(screen.getByText(/九型人格专业报告/)).toBeInTheDocument();
    });
  });

  describe('用户交互', () => {
    it('点击打印按钮应该触发打印', () => {
      const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {});

      render(<EnneagramReport result={mockResult} />);
      const exportButton = screen.getByRole('button', { name: /导出/ });
      fireEvent.click(exportButton);

      expect(printSpy).toHaveBeenCalled();
      printSpy.mockRestore();
    });
  });
});
