# Aayush Engineering Hub — Interview Questions to Video Blueprints

A comprehensive, day-wise and topic-wise roadmap designed for **Aayush Gupta** (@AayushGupta04). Every question is paired with its core algorithm, time & space complexity, a 45-second YouTube Short script/hook, and full code.

---

## Sprint Schedule Overview

| Day | Topic | Primary Problem | Core Invariant | Video Format | Target Duration |
|:---:|:---|:---|:---|:---|:---:|
| 1 | Two Pointers | Two Sum II (Sorted Array) | $O(n)$ inward scan | Short / Reel | 45 sec |
| 2 | Sliding Window | Longest Substring Without Repeating Characters | Dynamic window expansion & contract | Short / Long-form | 60 sec / 8 min |
| 3 | Monotonic Queue | Sliding Window Maximum (LC 239) | Decreasing deque maintains local max | Short | 50 sec |
| 4 | Fast & Slow Pointers | Linked List Cycle Detection (Floyd's) | Distance between pointers decreases | Short | 40 sec |
| 5 | Binary Search on Answer | Koko Eating Bananas (LC 875) | Monotonic feasibility check | Long-form | 10 min |
| 6 | Dynamic Programming | 0/1 Knapsack Pattern | Optimal substructure + overlapping subproblems | Long-form | 14 min |
| 7 | System Design | Scalable URL Shortener (TinyURL) | Base62 encoding + Redis caching | Long-form | 15 min |

---

## Day 1: Two Pointers — Two Sum on Sorted Arrays

### Problem & Intuition
* **Problem**: Given a 1-indexed sorted array, find two numbers that add up to a specific target number.
* **Brute Force**: Two nested loops testing every pair $\to O(n^2)$ time, $O(1)$ space.
* **Optimal Insight**: Because the array is sorted, place pointer `L` at index 0 and `R` at index `n - 1`. If `numbers[L] + numbers[R] < target`, the sum is too small, so increment `L`. If too large, decrement `R`.
* **Complexity**: $O(n)$ Time, $O(1)$ Auxiliary Space.

### 45-Second YouTube Short Voiceover Script
> **[0:00 - 0:08 Hook]** "Stop writing nested loops in coding interviews. If your array is sorted, you can solve Two Sum in one single pass without extra memory."
> 
> **[0:08 - 0:22 Intuition]** "Place pointer Left at the start and Right at the end. One plus eight is nine—too small? Move the left pointer up. Two plus eight is ten—target found!"
> 
> **[0:22 - 0:35 Complexity]** "Every step eliminates impossible combinations, cutting your runtime from quadratic O(N squared) straight to linear O(N)."
> 
> **[0:35 - 0:45 Call-to-Action]** "Follow Aayush Engineering Hub for daily, crystal-clear DSA walkthroughs. Code snippet is in the description!"

### Java Solution
```java
public class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int left = 0;
        int right = numbers.length - 1;
        while (left < right) {
            int currentSum = numbers[left] + numbers[right];
            if (currentSum == target) {
                return new int[]{left + 1, right + 1};
            } else if (currentSum < target) {
                left++;
            } else {
                right--;
            }
        }
        return new int[]{-1, -1};
    }
}
```

---

## Day 2: Sliding Window — Longest Substring Without Repeating Characters

### Problem & Intuition
* **Problem**: Find the length of the longest substring without repeating characters (LeetCode 3).
* **Optimal Insight**: Maintain a sliding window `[left, right]`. Use a HashMap or integer array of last seen character indices. When encountering a duplicate character, jump `left = max(left, lastSeen[char] + 1)`.
* **Complexity**: $O(n)$ Time, $O(\min(n, m))$ Space where $m$ is the character set size.

### 45-Second YouTube Short Voiceover Script
> **[0:00 - 0:08 Hook]** "Here is the exact pattern FAANG interviewers use to test your array fundamentals: the dynamic sliding window."
> 
> **[0:08 - 0:23 Walkthrough]** "Expand your window to the right, storing each character's index in a hash map. The instant you hit a character already in your window, don't restart from zero—just slide your left pointer right past the previous occurrence."
> 
> **[0:23 - 0:35 Takeaway]** "Your right pointer moves N times, and your left pointer only moves forward. That guarantees linear time O(N)."
> 
> **[0:35 - 0:45 CTA]** "Save this reel for your next technical round, and subscribe to Aayush Engineering Hub for more!"

### Python Solution
```python
def lengthOfLongestSubstring(s: str) -> int:
    char_map = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in char_map and char_map[char] >= left:
            left = char_map[char] + 1
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len
```

---

## Day 3: Monotonic Queue — Sliding Window Maximum

### Problem & Intuition
* **Problem**: Given an array `nums` and sliding window of size `k`, return the max in each window (LeetCode 239).
* **Optimal Insight**: A Monotonic Deque stores array indices in strictly decreasing order of their corresponding values.
  1. Pop elements from the back if `nums[back] < incoming_num`.
  2. Pop from the front if `front_index <= i - k` (out of window range).
  3. The front of the deque always holds the maximum for the current window.
* **Complexity**: $O(n)$ amortized Time, $O(k)$ Auxiliary Space.

### 45-Second YouTube Short Voiceover Script
> **[0:00 - 0:08 Hook]** "LeetCode 239 is marked Hard, but this 30-second data structure trick makes it trivial."
> 
> **[0:08 - 0:23 Intuition]** "Use a Monotonic Deque. When a new number arrives, pop every number smaller than it from the back. Why? Because they are smaller AND older—they can never be the maximum again!"
> 
> **[0:23 - 0:35 Invariant]** "Evict the front when it falls out of the k-window. The front is always your maximum. Every element is pushed and popped at most once."
> 
> **[0:35 - 0:45 CTA]** "Drop a like if this visual clicked, and check out my full LeetCode Hard playlist!"

---

## Day 4: Fast & Slow Pointers — Linked List Cycle Detection

### Problem & Intuition
* **Problem**: Determine if a singly linked list has a cycle (Floyd's Tortoise and Hare algorithm).
* **Optimal Insight**: `slow` advances 1 node per tick; `fast` advances 2 nodes per tick. If there is a cycle of length $C$, the relative distance between them shrinks by 1 on each step until they collide.
* **Complexity**: $O(n)$ Time, $O(1)$ Space.

### Java Solution
```java
public boolean hasCycle(ListNode head) {
    if (head == null || head.next == null) return false;
    ListNode slow = head;
    ListNode fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}
```

---

## Day 5: Binary Search on Solution Space — Koko Eating Bananas

### Problem & Intuition
* **Problem**: Find the minimum eating speed `k` such that Koko can eat all banana piles within `h` hours (LeetCode 875).
* **Optimal Insight**: If speed `k` works, any speed `> k` also works (monotonic condition). The search space is `[1, max(piles)]`. Binary search the speed!
* **Complexity**: $O(n \cdot \log(\max(\text{piles})))$ Time, $O(1)$ Space.

### YouTube Long-Form Outline
1. **0:00 - 1:30 Hook & Problem Formulation**: Why standard binary search fails on raw inputs, but succeeds on the answer range.
2. **1:30 - 4:00 The Feasibility Helper**: Writing `canFinishInTime(piles, speed, h)`.
3. **4:00 - 8:30 Binary Search Implementation**: Handling integer division ceil math `(pile + k - 1) / k`.
4. **8:30 - 10:00 Edge Cases & General Template**: Applying this pattern to LeetCode 1011 (Capacity to Ship Packages) and LeetCode 410 (Split Array Largest Sum).

---

## Day 6: Dynamic Programming — The 0/1 Knapsack Blueprint

### Problem & Intuition
* **Problem**: Given weights and values of $N$ items, put them in a knapsack of capacity $W$ to get the maximum total value.
* **Recurrence**:
  $$\text{dp}[i][w] = \max(\text{dp}[i-1][w], \text{val}[i-1] + \text{dp}[i-1][w - \text{wt}[i-1]])$$
* **Space Optimization**: Can be reduced to a 1D array of size $W+1$ by iterating backwards from $W$ down to $\text{wt}[i-1]$.

---

## Day 7: System Design — Scalable URL Shortener (TinyURL)

### Architecture Highlights
* **Scale Requirements**: 100 Million daily active writes, 1 Billion reads/day ($10:1$ read-heavy).
* **Storage Estimation**: 7-character Base62 string yields $62^7 \approx 3.52 \text{ Trillion}$ combinations.
* **Core Components**:
  1. **API Gateway**: Rate limiting with Token Bucket algorithm.
  2. **Distributed ID Generator**: Twitter Snowflake ID (timestamp + machine ID + sequence) to prevent collisions without centralized locks.
  3. **Base62 Converter**: Encodes 64-bit integer into 7 alphanumeric characters.
  4. **Cache**: Redis read-through cluster with LRU eviction for the top 20% trending links.
  5. **Database**: Distributed NoSQL (Cassandra/DynamoDB) with partition key on `short_hash`.

---

## Creator Metadata & Tags (SEO)
* **Primary Tags**: `Aayush Engineering Hub`, `DSA for Beginners`, `Coding Interview Questions`, `LeetCode Solutions`, `System Design Interview`, `Java DSA`, `Python Algorithms`, `Software Engineering Prep`
* **Hashtags**: `#DSA #LeetCode #CodingInterview #SoftwareEngineering #TechCareer`
