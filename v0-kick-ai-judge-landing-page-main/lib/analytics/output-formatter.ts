/**
 * Structured Output formatter for analytics results
 */

import { AnalysisResult } from './data-analyst';

export class OutputFormatter {
  
  /**
   * Format analysis result into structured markdown output
   */
  formatAnalysisResult(result: AnalysisResult): string {
    const lines: string[] = [];
    
    // Title
    lines.push(`## ${result.title}`);
    lines.push('');
    
    // Statistics
    if (result.statistics.length > 0) {
      result.statistics.forEach(stat => {
        let line = `• ${stat.emoji} **${stat.label}**: ${stat.value}`;
        if (stat.comment) {
          line += ` (${stat.comment})`;
        }
        lines.push(line);
      });
      lines.push('');
    }
    
    // Insights
    if (result.insights.length > 0) {
      result.insights.forEach(insight => {
        lines.push(`• ${insight.emoji} ${insight.text}`);
      });
      lines.push('');
    }
    
    // Conclusion
    if (result.conclusion) {
      lines.push(`**Висновок**: ${result.conclusion}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Format loading message during data collection
   */
  formatLoadingMessage(functionsToCall: string[]): string {
    const functionNames = {
      'get_k1_statistics': 'статистику K1',
      'get_muay_thai_statistics': 'статистику Muay Thai', 
      'get_boxing_statistics': 'статистику боксу',
      'get_mma_statistics': 'статистику MMA',
      'get_fighter_statistics': 'статистику бійця',
      'get_comparative_statistics': 'порівняльну статистику',
      'get_historical_trends': 'історичні тренди'
    };
    
    const descriptions = functionsToCall.map(fn => 
      functionNames[fn as keyof typeof functionNames] || fn
    );
    
    return `🔍 **Збираю дані...**\n\nАналізую: ${descriptions.join(', ')}\n\n⏳ Зачекайте, будь ласка...`;
  }
  
  /**
   * Format error message
   */
  formatErrorMessage(error: string): string {
    return `❌ **Помилка аналітики**\n\n${error}\n\nСпробуйте переформулювати запит або зверніться до звичайного чат-бота.`;
  }
  
  /**
   * Format function call results for debugging
   */
  formatFunctionResults(results: Record<string, any>): string {
    const lines: string[] = [];
    lines.push('📋 **Зібрані дані:**');
    lines.push('');
    
    Object.entries(results).forEach(([functionName, data]) => {
      lines.push(`**${functionName}:**`);
      if (typeof data === 'object') {
        Object.entries(data).forEach(([key, value]) => {
          lines.push(`  - ${key}: ${value}`);
        });
      } else {
        lines.push(`  - ${data}`);
      }
      lines.push('');
    });
    
    return lines.join('\n');
  }
  
  /**
   * Format comparative analysis
   */
  formatComparativeAnalysis(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) {
      return this.formatErrorMessage('Немає даних для порівняння');
    }
    
    const lines: string[] = [];
    lines.push('## 📊 Порівняльна аналітика дисциплін');
    lines.push('');
    
    // Sort by KO rate for better presentation
    const sortedData = [...data].sort((a, b) => (b.koRate || 0) - (a.koRate || 0));
    
    sortedData.forEach((item, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
      lines.push(`${medal} **${item.discipline}**`);
      lines.push(`  • 📊 Всього боїв: ${item.totalFights}`);
      lines.push(`  • 💥 Нокаутів: ${item.knockouts}`);
      lines.push(`  • 📈 KO Rate: ${item.koRate}%`);
      lines.push(`  • ⏱️ Середній раунд: ${item.averageRound}`);
      lines.push('');
    });
    
    // Add insights
    const highest = sortedData[0];
    const lowest = sortedData[sortedData.length - 1];
    
    lines.push('### 🧠 Інсайти:');
    lines.push(`• **${highest.discipline}** має найвищий KO rate (${highest.koRate}%)`);
    lines.push(`• **${lowest.discipline}** має найнижчий KO rate (${lowest.koRate}%)`);
    
    const avgKoRate = sortedData.reduce((sum, item) => sum + (item.koRate || 0), 0) / sortedData.length;
    lines.push(`• Середній KO rate серед усіх дисциплін: ${avgKoRate.toFixed(1)}%`);
    
    return lines.join('\n');
  }
}