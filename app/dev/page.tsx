import type { Metadata } from 'next';
import { DevTable } from '@/components/analyzer/DevTable';

export const metadata: Metadata = { title: 'Analyzer dev', robots: { index: false } };

// The spike test set (docs/analyzer/spike/testset.json): 3 owner picks + 25 artists with 300–5k monthly listeners.
const TEST_SET = [
  '4hWnpdm0As7Ruegjv2XD6W', '05ne02VCMleIvY0SzuPR9E', '08tsKE0fl1yaSTUPCfHxl4', '7cFQSJhOFNBRSV1LmhTHiu', '7uUmvE5TxPL0Ob5VJ5r6aI',
  '5X6fSnUVm2idKlcIdTgdmo', '6fsTr16sy4ahcPHaZy9nxl', '4gCETQRNP6RoEd6sGkxpSh', '3wVfVAT9OhYJxuj7F88HHQ', '4iNSAiAF7EA52E7wAyv4Zy',
  '2Jkq0j7MtxStajP7AW4pTO', '4wUsr3D2mIQODzPTSYsWCr', '6PuhGrzKFVUEFpBtg1XcfE', '3xPY4J5ADqDDFNwn75GF7p', '6wPIU4PYgAkuNkpWbcEA5s',
  '2dCCQ61NIrxiHyrqGfsbQR', '76EahZl4YdDQb1ZPxHHasl', '0vQfqOj73xFw48BXC7pmyb', '08tkOMHVdI1Ev4paZAJVx9', '007suf12P0lxOyBHNqjxOZ',
  '5Ewa4PaQc7Xt4YXaq9mhRw', '23Ol4DTOrp1wycb19K3Oij', '3JY2j2Z8Wxw8IEI5mV1AcT', '2cppegIhKCpeJ6wYxTLd4A', '4TBalbUBmIfSKFjk8nHkPR',
  '6W1QPcEGRAuS2r1uvmUwzd', '6CAHNDfFgE9a9S6eFudKt6', '5iHppCeLStxIG5Ml0HKDWN',
];

export default function Dev() {
  return (
    <main style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: 16, fontFamily: 'system-ui', fontSize: 12 }}>
      <h1 style={{ fontSize: 18 }}>Analyzer: end-to-end on the test set</h1>
      <DevTable ids={TEST_SET} />
    </main>
  );
}
